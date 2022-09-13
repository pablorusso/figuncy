# Figuncy

Te avisa si hay figuritas con una notificación en telegram.
Corré dentro de docker.

* Instalá Docker
* Crea la imagen con `docker build . -t moebius/figuncy`
* Ejecuta la imagen con `docker run --restart unless-stopped --ipc=host -d moebius/figuncy`
* Ver logs `docker logs $(docker ps | grep moebius/figuncy | awk '{print $1}')`
* Conectarse `docker exec -it $(docker ps | grep moebius/figuncy | awk '{print $1}') bash`

Corre cada 5 minutos.