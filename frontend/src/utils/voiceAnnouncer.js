export function speakTokenAnnouncement({ tokenNumber, doctorName, room, enabled = true }) {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  const synth = window.speechSynthesis;
  synth.cancel();
  if (synth.paused) {
    synth.resume();
  }

  const doctorPart = doctorName ? `, please proceed to ${doctorName}` : ', please proceed to the consultation room';
  const roomPart = room ? `, Room ${room}` : '';
  const text = `Token number ${tokenNumber}${doctorPart}${roomPart}.`;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-IN';
  utterance.rate = 0.92;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  const voices = synth.getVoices();
  const preferredVoice =
    voices.find((v) => v.lang.includes('en-IN')) ||
    voices.find((v) => v.lang.startsWith('en'));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  setTimeout(() => {
    synth.speak(utterance);
  }, 50);
}