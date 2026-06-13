# The Serfbound maps service, containerized (SB-43-01). Zero
# dependencies by design: the image is Node plus one file. The JSON
# store of published maps lives on the /data volume.
FROM node:22-alpine

WORKDIR /srv
COPY server.mjs ./

RUN mkdir -p /data && chown node:node /data
VOLUME /data
ENV SERFBOUND_MAPS_STORE=/data/maps.json

USER node
EXPOSE 4330
CMD ["node", "server.mjs"]
