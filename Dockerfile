FROM node:latest

WORKDIR /app

RUN echo "deb http://deb.debian.org/debian/ sid main" >> /etc/apt/sources.list \
  && apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 605C66F00D6C9793 \
  && apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 0E98404D386FA1D9 \
  && apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 648ACFD622F3D138 \
  && apt-get update -qqy \
  && apt-get -qqy install chromium \
  && rm -rf /var/lib/apt/lists/* /var/cache/apt/*

COPY . /app/
RUN npm install  --loglevel=error

CMD [ "npm", "start" ]
