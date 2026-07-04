async function test() {
  const nvidiaApiKey = "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";
  
  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${nvidiaApiKey}`,
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "google/diffusiongemma-26b-a4b-it",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an automated lead OCR scanner for Legal Success India. 
Analyze this screenshot image. Identify all potential customer contact/lead details. 
Specifically, extract any visible Names and Phone/Mobile numbers. 
Return a JSON object with a single "leads" array. Each lead must contain a "name" and a "phone" number.
Ensure to clean up the phone numbers (remove formatting characters like spaces, hyphens, brackets, but preserve country codes if relevant).
If a contact name is missing but a phone number is visible, use a descriptive placeholder like "Lead - Mobile" or similar.
If no contacts are found, return {"leads": []}.
Ensure your response is valid JSON only of the following structure:
{
  "leads": [
    { "name": "Name", "phone": "Clean phone number" }
  ]
}`
            },
            {
              type: "image_url",
              image_url: {
                url: `https://assets.ngc.nvidia.com/products/api-catalog/phi-3-5-vision/example1b.jpg`
              }
            }
          ]
        }
      ],
      max_tokens: 4096,
      temperature: 0.1,
      top_p: 0.95,
      chat_template_kwargs: { enable_thinking: true }
    })
  });
  console.log(response.status);
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
