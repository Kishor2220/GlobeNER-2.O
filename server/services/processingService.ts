import { FileService } from './fileService.ts';
import { NERService } from './nerService.ts';
import { DBService } from './dbService.ts';
import crypto from 'crypto';

export class ProcessingService {
  static async processDocument(file: { originalname: string; buffer: Buffer; mimetype: string }) {
    const startTime = Date.now();
    const documentId = crypto.randomUUID();
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    
    console.log(`[ProcessingService] Received file: ${file.originalname} (${file.mimetype})`);
    
    try {
      let text = "";
      if (ext === ".pdf") {
        text = await FileService.parsePDF(file.buffer);
      } else if (ext === ".csv") {
        const rows = await FileService.parseCSV(file.buffer);
        text = rows.join("\n");
      } else {
        text = await FileService.parseText(file.buffer);
      }
      
      console.log(`[ProcessingService] Text extracted (${text.length} chars)`);
      
      const entities = await NERService.extract(text);
      console.log(`[ProcessingService] Entities extracted: ${entities.length}`);
      
      const processingTime = Date.now() - startTime;
      
      // Calculate co-occurrences for relationships
      const relationships: any[] = [];
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          // Only link if they are different entities
          if (entities[i].text !== entities[j].text) {
            relationships.push({ source: entities[i], target: entities[j] });
          }
        }
      }
      
      // Persist
      DBService.saveDocument({
        id: documentId,
        filename: file.originalname,
        type: ext,
        content: text,
        processing_time: processingTime,
        status: 'completed'
      });
      
      DBService.saveEntities(entities, documentId);
      DBService.saveRelationships(relationships);
      
      console.log(`[ProcessingService] Workflow completed for ${documentId} in ${processingTime}ms`);
      
      return {
        id: documentId,
        filename: file.originalname,
        entities,
        processingTime,
        text: text.substring(0, 1000) // Return snippet
      };
    } catch (error: any) {
      console.error(`[ProcessingService] Error processing ${file.originalname}:`, error);
      throw error;
    }
  }
}
