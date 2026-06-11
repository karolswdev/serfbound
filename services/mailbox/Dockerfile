# The Serfbound mailbox service, containerized (SB-29-02). Zero
# dependencies by design: the image is Node plus one file. The JSON
# store lives on the /data volume.
FROM node:22-alpine

WORKDIR /srv
COPY server.mjs ./

RUN mkdir -p /data && chown node:node /data
VOLUME /data
ENV SERFBOUND_MAILBOX_STORE=/data/matches.json

USER node
EXPOSE 4320
CMD ["node", "server.mjs"]
