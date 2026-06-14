import fs from 'fs';
import readline from 'readline';

async function main() {
  const filePath = 'C:\\Users\\ranbe\\.gemini\\antigravity\\brain\\f8e5fc77-87be-4b72-a511-96ad864bb671\\.system_generated\\logs\\transcript.jsonl';
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.tool_calls) {
        for (const call of obj.tool_calls) {
          if (call.name === 'run_command') {
            const cmd = call.args.CommandLine;
            if (cmd && (cmd.includes('smoke-async-publish') || cmd.includes('wrangler') || cmd.includes('secret') || cmd.includes('secret:put'))) {
              console.log(`Step ${obj.step_index} (${call.args.Cwd}): ${cmd}`);
            }
          }
        }
      }
    } catch (err) {
      // ignore parsing errors
    }
  }
}

main().catch(console.error);
