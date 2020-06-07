<p align="center"><img src="./ic_launcher-web.png?raw=true" width="200px"/></p>

<h1 align="center">Wafelbak API</h1>

The 'Wafelbak' Web and Android applications are applications made to facilitate the process of ordering waffles for the benefit of ([Scouts Wondelgem](http://www.scoutswondelgem.be)).

This is a RESTful API for the applications.

---

## Getting Started

The server is currently hosted by [Google Cloud](https://cloud.google.com) [![Website](https://img.shields.io/website?label=backend&logo=google%20cloud&url=https%3A%2F%2Fwafelbak-api-p4tlzt4yxq-ew.a.run.app)](https://wafelbak-api-p4tlzt4yxq-ew.a.run.app).

> ### [`https://wafelbak-api-p4tlzt4yxq-ew.a.run.app`](https://wafelbak-api-p4tlzt4yxq-ew.a.run.app)

[**Visit the documentation website**](https://wafelbak-api-p4tlzt4yxq-ew.a.run.app)

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
<!--
### Trying routes with Insomnia
-->
<!--
We've included our [Insomnia](https://insomnia.rest/) configuration file for testing API calls. No automated end-to-end tests (yet).-->
<!--
You can find a guide on how to import this [here](https://support.insomnia.rest/article/52-importing-and-exporting-data). The data is located in the `Insomnia_2020_01_05.json` file.
-->
<!--
### Azure SQL Database
-->
<!--
This API relies on a [Microsoft Azure](azure.microsoft.com) database.
-->
<!--
1. Create a new file `.env` in the root folder of the project
2. Open the file and add following lines to it:

    ```bash
    WAFELBAK_BACKEND_SECRET="VictorIsDeBeste"
    WAFELBAK_DATABASE="WafelbakDatabase"
    DATABASE_USER="victorvh"
    DATABASE_PASSWORD="123Victor"
    DATABASE_SERVER="wafelbakserver.database.windows.net"
    DATABASE_DIALECT="mssql"
    ```-->
<!--
3. It is now possible to test the API with our database. **Don't abuse this.** Change the values to your own values when deploying. -->

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
