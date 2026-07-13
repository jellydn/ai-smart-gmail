// day8/notes.ts
// A tiny corpus of personal notes. The interesting part: some notes share almost
// no words with the queries we'll ask, yet should rank highest by MEANING.
// That is the test of "semantic" search vs keyword search.

export interface Note {
  id: string;
  text: string;
}

export const notes: Note[] = [
  {
    id: "n1",
    text: "Renew your passport at least six weeks before any trip abroad.",
  },
  {
    id: "n2",
    text: "The quarterly revenue report is due at the end of the month.",
  },
  {
    id: "n3",
    text: "Eat more leafy green vegetables to improve heart health.",
  },
  {
    id: "n4",
    text: "Book a dentist appointment for a routine cleaning.",
  },
  {
    id: "n5",
    text: "Our team shipped the new search feature to production this morning.",
  },
  {
    id: "n6",
    text: "Daily stretching helps reduce lower back pain.",
  },
  {
    id: "n7",
    text: "The customer invoice for March consulting services needs to be paid.",
  },
  {
    id: "n8",
    text: "Practicing mindfulness meditation lowers stress and anxiety.",
  },
  {
    id: "n9",
    text: "Back up your laptop files to an external drive every week.",
  },
  {
    id: "n10",
    text: "A balanced diet and regular exercise improve the quality of your sleep.",
  },
];
