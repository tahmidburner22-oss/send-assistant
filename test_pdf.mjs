import { readFileSync } from 'fs';
import { PDFParse } from 'pdf-parse';

const buf = readFileSync('/home/ubuntu/upload/1-multiplication-and-division-ws_copy.pdf');

async function test() {
  try {
    console.log('PDFParse type:', typeof PDFParse);
    const parser = new PDFParse({ data: buf, verbosity: 0 });
    await parser.load();
    const result = await parser.getText();
    const rawText = (result?.text ?? '');
    console.log('rawText length:', rawText.length);
    console.log('rawText sample:', rawText.slice(0, 200));
    const tooShort = !rawText || rawText.length < 20;
    if (tooShort) {
      console.log('ERROR: Would return 400 - text too short');
    } else {
      console.log('SUCCESS: Text extracted OK');
    }
  } catch(e) {
    console.error('CATCH ERROR:', e.message);
    console.error('Stack:', e.stack?.slice(0, 300));
  }
}

test();
