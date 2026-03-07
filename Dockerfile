FROM node:20-alpine

WORKDIR /app

COPY BackendSide/package*.json ./BackendSide/
RUN cd BackendSide && npm ci --omit=dev

COPY FrontendSide/package*.json ./FrontendSide/
RUN cd FrontendSide && npm ci

COPY BackendSide ./BackendSide
COPY FrontendSide ./FrontendSide

RUN cd FrontendSide && npm run build

ENV NODE_ENV=production
ENV PORT=5020

EXPOSE 5020 5021

CMD ["sh","-c","cd /app/BackendSide && PORT=5020 node server.js & cd /app/FrontendSide && npm run preview -- --host 0.0.0.0 --port 5021"]