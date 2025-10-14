import { getConfig } from './config.ts';
import { build } from './server.ts';

const config = getConfig();
const server = await build(config);

server.listen({ port: config.port }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
});

