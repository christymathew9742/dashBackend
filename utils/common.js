function cleanAIResponse(response) {
    const parts = response.split(':');
    return parts.length > 1 ? parts.slice(1).join(':').trim() : response.trim();
}

module.exports = cleanAIResponse;


  