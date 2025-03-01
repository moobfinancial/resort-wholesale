import axios from 'axios';

const ELEVEN_LABS_API_KEY = 'sk_b1850e87862707755f5fade11515aa49a79ed2cc3a4b9273';
const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1';

async function testElevenLabsVoices() {
  try {
    console.log('Fetching voices from Eleven Labs...');
    const response = await axios.get(`${ELEVEN_LABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    console.log('Voices fetched successfully:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.voices.length > 0) {
      console.log('\nTesting voice preview for first voice...');
      const firstVoice = response.data.voices[0];
      console.log('Preview URL:', firstVoice.preview_url);
    }
  } catch (error) {
    console.error('Error testing Eleven Labs integration:', error);
  }
}

testElevenLabsVoices();
