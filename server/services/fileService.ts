import { parse } from 'csv-parse/sync';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

export class FileService {
  static async parseCSV(buffer: Buffer): Promise<string[]> {
    console.log("[FileService] Parsing CSV...");
    try {
      const records = parse(buffer, {
        columns: false,
        skip_empty_lines: true
      });
      const data = records.flat().filter((text: any) => typeof text === 'string' && text.length > 0);
      console.log(`[FileService] CSV parsed. Rows: ${data.length}`);
      return data;
    } catch (err) {
      console.error("[FileService] CSV parsing failed:", err);
      throw new Error("Failed to parse CSV file.");
    }
  }

  static async parsePDF(buffer: Buffer): Promise<string> {
    console.log("[FileService] Parsing PDF...");
    if (!buffer || buffer.length === 0) {
      throw new Error("Invalid PDF buffer");
    }
    try {
      const data = await pdf(buffer);
      console.log(`[FileService] PDF parsed. Text length: ${data.text?.length || 0}`);
      return data.text || "";
    } catch (err) {
      console.error("[FileService] PDF parsing failed:", err);
      throw new Error("Failed to extract text from PDF. Ensure the file is not corrupted or password protected.");
    }
  }

  static async parseText(buffer: Buffer): Promise<string> {
    console.log("[FileService] Parsing Text...");
    return buffer.toString('utf-8');
  }
}
