<p align="center"><img src="./backend_icon.svg" width="200px"/></p>

<h1 align="center">Wafelbak API</h1>

The 'Wafelbak' Android application is an application made to facilitate the process of ordering waffles for the benefit of ([Scouts Wondelgem](http://www.scoutswondelgem.be)).

This is a RESTful API for the applications.

---

## Getting Started

The server is currently hosted by [Heroku](https://www.heroku.com/) [![Website](https://img.shields.io/website?label=backend&logo=heroku&url=https%3A%2F%2Fwafelbak-backend.herokuapp.com%2Fdocs)](https://wafelbak-backend.herokuapp.com/docs).

> ### [`https://wafelbak-backend.herokuapp.com/docs`](https://wafelbak-backend.herokuapp.com/docs)

[**Visit the documentation website**](https://wafelbak-backend.herokuapp.com/docs)

### Installation

1. Clone this repo

   ```bash
   git clone https://github.com/VictorOwnt/WafelbakBackend
   ```

2. Open the project root directory

   ```bash
   cd WafelbakBackend
   ```

3. Install dependencies from npm

   ```bash
   npm install
   ```

4. Run the project

   ```bash
   npm start
   ```

   Use [nodemon](https://nodemon.io/) to reload the server automatically on changes:

   ```bash
   npm start-local
   ```

   The server is now running at `localhost:3000`

> Copy paste this in your terminal if you're lazy. 😴
>
> ```bash
> git clone https://github.com/VictorOwnt/WafelbakBackend && cd WafelbakBackend && npm i && npm start
> ```

#### Dummy login

Use the login credentials stated below to test the project's functionality.

Client:

- Email: *`client@gmail.com`*
- Password: *`test00##`*

Admin:

- Email: *`admin@gmail.com`*
- Password: *`test00##`*

### Trying routes with Insomnia

We've included our [Insomnia](https://insomnia.rest/) configuration file for testing API calls. No automated end-to-end tests (yet).

You can find a guide on how to import this [here](https://support.insomnia.rest/article/52-importing-and-exporting-data). The data is located in the `Insomnia_2020_01_05.json` file.

## Built With

- [Express](https://expressjs.com/)
- [Sequellize](https://sequelize.org)
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
- [Passport](http://www.passportjs.org/)
- [zxcvbn](https://github.com/dropbox/zxcvbn)
- [Swagger](https://swagger.io/)

## Creator

| <a href="https://github.com/VictorOwnt" target="_blank">**Victor Van Hulle**</a> |
| --- |
| [![Victor](https://avatars2.githubusercontent.com/u/17174095?s=200)](https://github.com/VictorOwnt) |
