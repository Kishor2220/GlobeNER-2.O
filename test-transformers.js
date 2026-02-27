import { pipeline, env } from '@xenova/transformers';

env.localModelPath = './local_models';
env.cacheDir = './local_models';

async function test() {
  try {
    const extractor = await pipeline('token-classification', 'Xenova/bert-base-multilingual-cased-ner-hrl');
    const out = await extractor('I went to San Francisco and met Christopher.', { ignore_labels: [] });
    console.log(out);
  } catch (e) {
    console.error(e);
  }
}

test();
