import { logger } from "../logger";

export interface MoneyMatch {
  text: string;
  label: "MONEY";
  amount_numeric: number;
  currency: string;
  confidence: number;
  start: number;
  end: number;
  method: "regex";
}

export class MoneyRegexEngine {
  private static readonly SYMBOLS = "[$€£₹¥₩₽฿₫₦₱₪₡₴₲₵]";
  private static readonly CODES = "USD|EUR|GBP|INR|JPY|CNY|AUD|CAD|SGD|AED|SAR|ZAR|CHF";
  private static readonly WORDS = "dollars?|rupees?|pounds?|euros?|yen|dirhams?|lakhs?|crores?|millions?|billions?|trillions?";
  
  private static readonly MULTIPLIERS: Record<string, number> = {
    'k': 1000,
    'm': 1000000,
    'b': 1000000000,
    't': 1000000000000,
    'l': 100000,
    'lakh': 100000,
    'lakhs': 100000,
    'cr': 10000000,
    'crore': 10000000,
    'crores': 10000000,
    'million': 1000000,
    'millions': 1000000,
    'billion': 1000000000,
    'billions': 1000000000,
    'trillion': 1000000000000,
    'trillions': 1000000000000
  };

  private static readonly SYMBOL_TO_CODE: Record<string, string> = {
    '$': 'USD',
    '€': 'EUR',
    '£': 'GBP',
    '₹': 'INR',
    '¥': 'JPY',
    '₩': 'KRW',
    '₽': 'RUB',
    '฿': 'THB',
    '₫': 'VND',
    '₦': 'NGN',
    '₱': 'PHP',
    '₪': 'ILS',
    '₡': 'CRC',
    '₴': 'UAH',
    '₲': 'PYG',
    '₵': 'GHS'
  };

  private static readonly WORD_TO_CODE: Record<string, string> = {
    'dollar': 'USD',
    'dollars': 'USD',
    'rupee': 'INR',
    'rupees': 'INR',
    'pound': 'GBP',
    'pounds': 'GBP',
    'euro': 'EUR',
    'euros': 'EUR',
    'yen': 'JPY',
    'dirham': 'AED',
    'dirhams': 'AED'
  };

  /**
   * Main extraction method for MONEY entities
   */
  static extract(text: string): MoneyMatch[] {
    const results: MoneyMatch[] = [];
    try {
      const patterns = this.getPatterns();
      patterns.forEach(pattern => {
        let match;
        pattern.lastIndex = 0;
        while ((match = pattern.exec(text)) !== null) {
          const matchedText = match[0];
          const normalized = this.normalize(matchedText);
          
          if (normalized) {
            results.push({
              text: matchedText,
              label: "MONEY",
              amount_numeric: normalized.amount,
              currency: normalized.currency,
              confidence: 0.95,
              start: match.index,
              end: match.index + matchedText.length,
              method: "regex"
            });
          }
        }
      });
    } catch (err) {
      logger.error("Money extraction failed", "MoneyRegexEngine", err);
    }
    return results;
  }

  private static getPatterns(): RegExp[] {
    const S = this.SYMBOLS;
    const C = this.CODES;
    const W = this.WORDS;
    const N = "[0-9]+(?:[,.][0-9]+)*";
    const M = "(?:[kKmMbBtT]|lakhs?|crores?|million|billion|trillion|L|Cr)";

    return [
      // 1. Symbol/Code + Number + Optional Multiplier: $1,000, INR 500, $5k, ₹2Cr
      new RegExp(`(?:${S}|${C})\\s?-?${N}\\s?${M}?`, 'gi'),
      
      // 2. Number + Multiplier + Symbol/Code/Word: 5 million USD, 10 lakh rupees
      new RegExp(`${N}\\s?${M}?\\s?(?:${S}|${C}|${W})`, 'gi'),
      
      // 3. Negative amounts in parentheses: ($500), (₹5,000)
      new RegExp(`\\(\\s?(?:${S}|${C})\\s?${N}\\s?${M}?\\s?\\)`, 'gi'),
      
      // 4. Negative amounts with minus: -$500, -INR 1000
      new RegExp(`-\\s?(?:${S}|${C})\\s?${N}\\s?${M}?`, 'gi')
    ];
  }

  private static normalize(text: string): { amount: number; currency: string } | null {
    try {
      const cleanText = text.replace(/[()]/g, '').trim();
      const isNegative = text.includes('-') || (text.startsWith('(') && text.endsWith(')'));
      
      // Extract numeric part
      const numericMatch = cleanText.match(/[0-9]+(?:[,.][0-9]+)*/);
      if (!numericMatch) return null;
      
      let amountStr = numericMatch[0].replace(/,/g, '');
      
      // Handle Indian numbering system (e.g., 1,00,000) - already handled by removing commas
      // But we need to be careful if there's a decimal point
      const parts = amountStr.split('.');
      if (parts.length > 2) {
        // Invalid number format (multiple dots)
        return null;
      }
      
      let amount = parseFloat(amountStr);
      if (isNaN(amount)) return null;

      // Apply multiplier
      const multiplierMatch = cleanText.match(/(?:[kKmMbBtT]|lakhs?|crores?|million|billion|trillion|L|Cr)/i);
      if (multiplierMatch) {
        const m = multiplierMatch[0].toLowerCase();
        const factor = this.MULTIPLIERS[m] || 1;
        amount *= factor;
      }

      if (isNegative) amount *= -1;

      // Extract currency
      let currency = "UNKNOWN";
      
      // Check symbols
      const symbolMatch = cleanText.match(new RegExp(this.SYMBOLS));
      if (symbolMatch) {
        currency = this.SYMBOL_TO_CODE[symbolMatch[0]] || "UNKNOWN";
      }
      
      // Check codes
      if (currency === "UNKNOWN") {
        const codeMatch = cleanText.match(new RegExp(this.CODES, 'i'));
        if (codeMatch) {
          currency = codeMatch[0].toUpperCase();
        }
      }
      
      // Check words
      if (currency === "UNKNOWN") {
        const wordMatch = cleanText.match(new RegExp(this.WORDS, 'i'));
        if (wordMatch) {
          const word = wordMatch[0].toLowerCase().replace(/s$/, ''); // singularize
          currency = this.WORD_TO_CODE[word] || this.WORD_TO_CODE[word + 's'] || "UNKNOWN";
        }
      }

      // Final validation: Avoid years (e.g., $2024 is probably money, but 2024 alone is not)
      // The regex already requires a currency indicator, so plain numbers are avoided.
      
      return { amount, currency };
    } catch (err) {
      logger.error("Normalization failed", "MoneyRegexEngine", err);
      return null;
    }
  }
}
