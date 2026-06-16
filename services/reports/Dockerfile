# The Serfbound reports service, containerized (SB-44-06). Zero
# dependencies by design: the image is Node plus one file. The JSON
# store of submitted playtest reports lives on the /data volume.
FROM node:22-alpine

WORKDIR /srv
COPY server.mjs ./

RUN mkdir -p /data && chown node:node /data
VOLUME /data
ENV SERFBOUND_REPORTS_STORE=/data/reports.json

USER node
EXPOSE 4340
CMD ["node", "server.mjs"]
