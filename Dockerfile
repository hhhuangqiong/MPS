FROM mhart/alpine-node:6
MAINTAINER "Andy Hui" <andyhui@maaii.com>

# To configure the timezone to Asia/Hong_Kong
# TODO: make it as m800-alpine-node
RUN apk add --update tzdata && \
    cp /usr/share/zoneinfo/Asia/Hong_Kong /etc/localtime && \
    echo "Asia/Hong_Kong" > /etc/timezone

# This dockerfile is designed to run from the jenkins build server, i.e. please
# run 'npm install' and 'gulp' to prepare all dependencies and build the project.
# The built/compiled/installed dependencies with be copied into the docker image
# using the COPY command instead.
COPY . /app/

WORKDIR /app

ENV NODE_ENV=production

# 1. application listen port
# 3. expose for debug purpose
EXPOSE 3000 5858

USER nobody

CMD ["npm", "run", "server"]
