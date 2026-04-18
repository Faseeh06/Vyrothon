# CipherStack

**VYRO Hackathon — Frontend · Hard · 1h 45m**  
Node-based **cascade encryption** builder: chain three or more configurable ciphers, run encrypt and decrypt in reverse, and read per-node inputs and outputs.

## Tech

- [Next.js](https://nextjs.org/) (App Router), React 19, TypeScript  
- Tailwind CSS v4, Radix UI via [shadcn/ui](https://ui.shadcn.com/) patterns in `components/ui/`  
- Cipher logic in `lib/cipher-stack/` (Caesar, XOR→hex, Vigenère)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the short landing page. The pipeline lives at [http://localhost:3000/builder](http://localhost:3000/builder).

## Deploy

Deploy on [Vercel](https://vercel.com/) or any host that supports Next.js. Set the build command to `npm run build` and output `.next` per your platform defaults.

## Docs

- [IMPLEMENTED.md](./IMPLEMENTED.md) — short list of what is built today.
- [REMAINING.md](./REMAINING.md) — optional work and polish still open.
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) — architecture, spec mapping, extension notes.
