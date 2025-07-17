const { JSDOM } = require('jsdom');
const {
    getValidationHint,
} = require('../../utils/common');

const generateDynamicFlowData = (flowData) => {
  const output = [];
  const nodeMap = new Map();
  let stepCounter = 0;

  if (!flowData?.nodes?.length) return output;
  flowData.nodes.forEach(node => nodeMap.set(node.id, node));

  const generatePromptList = (fields) =>
    fields.map(f => f.toLowerCase().replace(/_/g, " ")).join(", ");

  const generateOptionList = (options = []) =>
    options.map(opt => ({
      id: `P-${opt?.id}`,
      value: opt?.value?.length > 24 ? `${opt.value.slice(0, 21)}...` : opt.value,
    }));

  const parseFollowUp = (input, currentStep) => {
    const { field, value = "", type, options } = input || {};
    const optionList = generateOptionList(options);
    let requiredFields = [];

    try {
      if (field === "replay") {
        const dom = new JSDOM(value);
        requiredFields = [...(dom.window.document.body.innerHTML.match(/\[(.*?)\]/g) || [])].map(v => v.slice(1, -1));
      }

      const cleanedMessage = field === "messages" ? value.replace(/<[^>]+>/g, "").trim() : "";
      const validationHint = getValidationHint(type, requiredFields);

      switch (field) {
        case "messages":
          return `- Initial Message:\n  - "${cleanedMessage}"\n  - Ask this exactly without rephrasing. Politely verify spelling. If off-topic, redirect to this question again.`;

        case "replay":
          return requiredFields.length
            ? `- Follow-up Required (Step ${currentStep}):\n  - Ask for: ${generatePromptList(requiredFields)}\n - ${validationHint}\n  - Wait until all required fields are collected before proceeding.`
            : `- Follow-up (Step ${currentStep}): No required fields detected. You may proceed.`;

        case "preference":
          return `- Initial Preference (Step ${currentStep}):\n  - Return ONLY this JSON array. No quotes, markdown, or formatting.\n  ${JSON.stringify(optionList)}`;

        default:
          return null;
      }
    } catch (err) {
      console.error("Error in follow-up parsing:", err.message);
      return null;
    }
  };

  const getNodeConnections = (nodeId) => {
    const direct = [];
    const conditional = [];

    for (const edge of flowData.edges || []) {
      if (edge.source === nodeId) {
        const { sourceHandle = "", target } = edge;
        if (sourceHandle.startsWith("option-")) {
          conditional.push({
            optionId: `P-${sourceHandle.split("-")[1]}`,
            target,
          });
        } else {
          direct.push(target);
        }
      }
    }

    return { directTargets: direct, conditionalTargets: conditional };
  };

  const processNode = (nodeId, visited = new Set()) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    stepCounter++;

    const node = nodeMap.get(nodeId);
    if (!node?.data?.inputs) return;

    const stepInstructions = [];
    const { directTargets, conditionalTargets } = getNodeConnections(nodeId);

    for (const input of node.data.inputs) {
      const instruction = parseFollowUp(input, stepCounter);
      if (instruction) stepInstructions.push(instruction);
    }

    const step = {
      section: `Step ${stepCounter}`,
      nodeId,
      instructions: [`- sourceNodeId: '${nodeId}'`, ...stepInstructions],
    };

    if (directTargets.length && conditionalTargets.length === 0) {
      step.instructions.push(`- Navigate to the next Target sourceNodeId = '${directTargets[0]}'\n  - Condition: Proceed only after required data is Collected and currect Format.`);
    } 

    if (conditionalTargets.length) {
      step.instructions.push(`- Map Consultant selection to target sourceNodeId using id. Proceed only if id(example:P-1751966538888) matches one of the below:\n  - ${conditionalTargets.map(ct => `- if Consultant responce = ${ct.optionId}, navigate to the step with sourceNodeId = ${ct.target}`).join('\n  - ')}`);
    } else {
      step.instructions.push(`- if not an  Initial Preference:**Mandatory**: At the point of final conclusion (e.g., thank-you message), create and store a JavaScript object where each required field is a key and the corresponding validated Consultent input is the value.✅ This object must be included in the conversation history together with the final message of AI in Json format.`);
    }

    output.push(step);

    [...directTargets, ...conditionalTargets.map(c => c.target)].forEach(next => {
      if (nodeMap.has(next)) processNode(next, visited);
    });
  };

  processNode(flowData.nodes[0]?.id);

  output.push(
    {
      section: "Domain-Specific Actions",
      instructions: [
        '- Detect user intent: booking, rescheduling, cancelling, general query.',
        '- Look for keywords like "Book slot", "Cancel appointment", etc. and route accordingly.',
      ],
    },
    {
      section: 'Strict AI Behavior Rules',
      instructions: [
        '- Rule: Do NOT mention or explain your actions (e.g., going back, repeating, restarting, step flow, etc..). Just ask the next message directly.',
        '- Rule: When navigating to a previous step, display the original message exactly as given — no justification, no context, no paraphrasing.',
        '- Rule: If reaching a preference step again, display ONLY the same JSON array from the original step without extra comments or wrapping text.',
        '- Rule: NEVER add phrases like "You selected", "Let me ask again", "Going back", "Repeating", "Based on your answer", etc.',
        '- Rule: Ask each question in the exact wording provided in the original instruction ("Initial Message") block.',
        '- Rule: If any step is marked as "Mandatory: true", it must be collected before proceeding.',
        '- Rule: If any field has validation requirements, strictly enforce them with only Error Message[Eg:Please enter a valid [fieldName]] before proceeding.',
        '- Rule: If multiple required fields are mentioned, collect all before moving forward.',
        '- Rule: Allow RE-COLLECT the fields **if** the user explicitly wants to update or is redirected to that step.',
        '- Rule: Treat every step transition as atomic. Do not carry over assistant reasoning or interpretation.',
        '- Tone  Rule: Ask all questions politely, directly, and neutrally — avoid robotic or overly smart tone.',
        '- Rule: Never alter, summarize, interpret, or wrap the message. Use the exact content inside instructions without change.',
        '- Rule: Respond with no more than **20 words**.',
        '- Rule: If the conversation flow has no next target step, politely conclude the conversation.',
        '- Keyword Enforcement: "Initial Message", "Follow-up Required", "Initial Preference", "Mandatory", "Expected", "Validate" — respect these strictly as behavioral directives.',

        '**Fallback Handling:**',
          '- Fallback: If the user provides invalid input more than 2 times for a required field, politely re-state the expected format with an example.',
          '- Fallback: Respond politely based on available flodata for off-topic queries and back to the correct step, Ensuring the conversation stays aligned with the flow structure.',
          '- Fallback: After 3 failed attempts, offer clarification or escalate gently with a suggestion like: "Would you like an example?" or "You can also say ‘help’ for guidance."',
          '- Fallback: Never get stuck or loop indefinitely. If confusion persists, offer to restart the current step with: "Let’s try this step again from the beginning."',
          '- Fallback  Trigger: Applies only to inputs marked as "Mandatory" with an "Expected" format.',
          '- Fallback  Behavior: Always maintain polite tone, avoid blame, and rephrase only the error explanation — not the original question.',
      ]
    },
    {
      section: "Emoji & Sentiment Handling",
      instructions: [
        '- Detect if the user message contains emojis.',
        '- Use emoji as emotional signals, but do NOT mention or call out the emoji directly (e.g., never say "I see you sent 😊").',
        '- Respond with emotionally appropriate tone based on detected emoji sentiment:',
        '  - 😊 😀 😄 😍 👍 ❤️ → Positive: Respond warmly and continue the flow.',
        '  - 😢 😞 😠 😡 👎 💔 → Negative: Respond empathetically, acknowledge the tone, and gently guide back to the flow.',
        '  - 🤔 😐 😶 ❓ → Confusion/Uncertainty: Politely offer to clarify or repeat the previous instruction.',
        '- Emoji should not interfere with validation. If input is expected (e.g., name/age), ignore the emoji for validation logic.',
        '- If emoji is the only content and no input is collected, politely prompt the user again with the original message.',
        '- Never try to guess intent or make assumptions based solely on emoji. Only use it to adjust tone of reply.',
        '- Always maintain polite, human-like tone — do not overreact or exaggerate emotional responses.',
      ]
    },
    {
      section: "Resolution & Conclusion",
      instructions: [
        '- **Mandatory**:Ensure all required fields are collected',
        '- End politely: "Thanks for connecting. Have a great day!"',
      ],
    },
  );

  return output;
};

module.exports = generateDynamicFlowData;

















