FROM node:22-bookworm-slim AS builder

WORKDIR /app

ENV BENTIX_DATA_SOURCE=json
ENV NEXT_PUBLIC_API_BASE_URL=""
ENV AUTH_SECRET=build-only-secret
ENV LOGIN_PUBLIC_KEY_PEM="-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxk1Aa4yLLZGMu5znhEXa\nWBbI3afERl237d0oQNMdbQaw/QZZcNp8v+yrLbK2DH9mGguZpbcK7MwQMkPq8ASA\nTD/MA5+1cph/miJ8+No1sr27rD+zBLy1ZN42sXhm3q1sG2KStTVuDWwc/6+E0K1/\nal1ccugwRge02alFI08MThxJ3kQYwsYKmiRmr001liMcN59X+W3CDuEMcCjnDzCd\nJwwlQy9W7UF9/hUuTEq4byW9Sm3GFMrclVJABBlGoJXzHL84hvvoiw10ZBspmbhh\nd9s+gIkCDSKXOeuslQEx5cBWjs2brkUz7L20PUoeqkW3SEX+3s/oV1GLRAUzadiF\nbQIDAQAB\n-----END PUBLIC KEY-----\n"
ENV LOGIN_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDGTUBrjIstkYy7\nnOeERdpYFsjdp8RGXbft3ShA0x1tBrD9Bllw2ny/7KstsrYMf2YaC5mltwrszBAy\nQ+rwBIBMP8wDn7VymH+aInz42jWyvbusP7MEvLVk3jaxeGberWwbYpK1NW4NbBz/\nr4TQrX9qXVxy6DBGB7TZqUUjTwxOHEneRBjCxgqaJGavTTWWIxw3n1f5bcIO4Qxw\nKOcPMJ0nDCVDL1btQX3+FS5MSrhvJb1KbcYUytyVUkAEGUaglfMcvziG++iLDXRk\nGymZuGF32z6AiQINIpc566yVATHlwFaOzZuuRTPsvbQ9Sh6qRbdIRf7ez+hXUYtE\nBTNp2IVtAgMBAAECggEAAXm/r00wwppg/rW7L0vJxSVeQe/7+5Nk8/sqT9ks+zZf\n3hzMUOpUn/pQh8WFqfAkwAWIE33vhzWO2qDmFaUi7e5SQ/tN7AK10wggqpq3vZMV\n22vvQWtvZMcWhxmLQmrt8VeOxJRs3jgIuzUA0FYKKwNzgFNj+zwWx2vasi7mEOAM\n+nwtHQ4YlSwkogqt9OcRxne6YwuqYXvnxT3oTgaswegjJ6/fgpAJzyXpcI8XQuA9\nZzLPhUyRcpRJ3/bVfwYGhPYk4+/oXpwqY/gV6bqBxlSQKamTIPu5Slv7rc3FjDkS\nYpybLfa0M3J3kgPaZGPgw1vLyWjG3Xe+ceUcw2UibQKBgQD3bcv4liiz7PAnMzeT\nmsFyC+N+eBbTpY1GltBFt1Nz1KeXx1cs4kvSSneAuUz33YkkTja3co2aRBh9eZRV\nTJFlnCiw6rM7APRdlhcNThxDpTlv61QccdCZKU8elUZG984xWUGe0LHG1FoILHUU\nS+WpMo55KBqkoF9UEUHDWNzkkwKBgQDNK8t0C27O7IRRPGbTXxuqafA+8G0a9B0L\najnlckwKC2erf4EYJAtZL9NDoyk+DIlgwrVeBLVBXXAdv93xOl8VeIpb0nWpl9DS\nJAhfPIQN/BnC6mLaHWjyTCMYsoBJ8rH1FHrGJY4XGXBC/3YpNoMlaIpM6VUOCp5F\nCVmT2LEt/wKBgQCj9GKbl8zi5ReBskOakIqs6snVjPf7SRFjfB4IhGFNONXREmtm\nt5FsiKHFb4RcHrV4lEdXqhXA6mycAItVNoaGIUMpcGxRpeFHfmRKEb9S59I2oma6\n7oQ+aYwfBOVrs1szgiSkez/CNAZwshzm1SAazQBxsixteEOS7lh4fJLq9wKBgAIT\nWliPMQzI2cHUoZmr0aTUs4h/eCsYox6VcYZ/tIM5gE/81zp+StsZH8MEaItnJxCi\nh6Eu3QKPRm4WndEt7P5TnNq281fG4Gbv1GHaQ9+8WCpfoqZgO8qPuJ8sVx3oZaJ8\nFY3hnWFgcYFMAk8CbSs4toV2qtSciONb59sWCxzTAoGAdfcHS5uEHTa/KFXWnGsw\nLdPjInmCSccUF4+vF3poKlsGvJRV4DCI8PXM/g8l5pQDZlES2YhbsgJpXZJN9aV0\n+ZeELsldKgudakVd9nncYVzseLrqPWeDoAbMVqdkKxP/9zEpCgnGV9V9m87Tm69I\nZf24gYizUP4evNV8CkVOtck=\n-----END PRIVATE KEY-----\n"

COPY package.json package-lock.json ./
RUN npm ci

COPY schema.prisma prisma.config.ts next.config.js ./
COPY app ./app
COPY frontend ./frontend
COPY lib ./lib
COPY server ./server
COPY scripts ./scripts
COPY data ./data

RUN npm run db:generate
RUN npm run build

FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/app ./app
COPY --from=builder /app/frontend ./frontend
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/server ./server
COPY --from=builder /app/data ./data
COPY --from=builder /app/schema.prisma ./schema.prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/next.config.js ./next.config.js

EXPOSE 3000

CMD ["npm", "start"]
