const {
  Telegraf,
  Markup,
  Extra,
  Context,
  Scenes: { WizardScene, Stage, BaseScene },
  session,
  Scenes,
} = require("telegraf");
const moment = require("moment");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const startScene = new Scenes.BaseScene("startScene");
const black = new Scenes.BaseScene("black");
const removeChoice = new Scenes.BaseScene("removeChoice");
const recordClient = new Scenes.BaseScene("recordClient");
const nameClientSce = new Scenes.BaseScene("nameClientSce");
const removeChoiceAdmin = new Scenes.BaseScene("removeChoiceAdmin");
const stage = new Stage([
  startScene,
  black,
  removeChoice,
  recordClient,
  nameClientSce,
  removeChoiceAdmin,
]);

bot.use(Telegraf.log());
let adminMenu = ["Записать клиента", "Удалить запись клиента"];
bot.use(session());
bot.use(stage.middleware());
bot.hears("/start", Stage.enter("startScene"));
bot.hears("/777", Stage.enter("black"));
bot.hears("Удалить запись", Stage.enter("removeChoice"));
bot.hears("запись", Stage.enter("recordClient"));
bot.hears("старт", Stage.enter("recordClient"));
bot.hears("1", Stage.enter("recordClient"));
bot.hears("Указать имя клиента", Stage.enter("nameClientSce"));
bot.hears("Новая запись", Stage.enter("recordClient"));
//bot.hears("Вернуться в начало", Stage.enter("recordClient"));
bot.hears("/555", (ctx) =>
  ctx.reply(
    "Выбирайте по кнопкам",
    Markup.keyboard(adminMenu).oneTime().resize()
  )
);
bot.hears("Удалить запись клиента", Stage.enter("removeChoiceAdmin"));

//bot.help((ctx) => ctx.reply("Send me a sticker"));
//bot.on("sticker", (ctx) => ctx.reply("👍"));
//bot.hears("hi", (ctx) => ctx.reply("Heloooooo"));
bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

const { google } = require("googleapis");
//const keys = require("./keys.json");
const idSheets = process.env.ID_SHEETS;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;

const client = new google.auth.JWT(
  GOOGLE_CLIENT_EMAIL,
  null,
  GOOGLE_PRIVATE_KEY,
  ["https://www.googleapis.com/auth/spreadsheets"]
);
//console.log(moment().format());
client.authorize(function (err, tokens) {
  if (err) {
    console.log(err);
    return;
  } else {
    console.log("Connected");
    gsrun(client);
  }
});

async function gsrun(cl) {
  try {
    const gsapi = google.sheets({ version: "v4", auth: cl });
    metaData = await gsapi.spreadsheets.get({
      spreadsheetId: idSheets,
    });
    // Формируем список первых двух рабочих листов

    let listSetting = new Array();
    for (i = 0; i < 2; i++) {
      listSetting.push(metaData.data.sheets[i].properties.title);
    }

    let listSheet = [];
    for (let i = 2; i < metaData.data.sheets.length; i++) {
      listSheet.push(metaData.data.sheets[i].properties.title);
    }
    // Получаем данные из таблицы оодним запросом -------------------------------------------------------------------
    let dataBase = await gsapi.spreadsheets.values.batchGet({
      spreadsheetId: idSheets,
      ranges: [
        `${listSetting[1]}!A2:A`,
        `${listSheet[0]}!A4:A`,
        `${listSheet[0]}!3:3`,
        `${listSheet[0]}!2:2`,
        `${listSetting[1]}!B2:B`,
      ],
    });

    let serviceList = dataBase.data.valueRanges[0].values.flat();
    let numberRecords = dataBase.data.valueRanges[1].values.length;
    let timeArray = dataBase.data.valueRanges[1].values.flat();
    let dateSheets = dataBase.data.valueRanges[2].values.flat();
    let dateArr = dataBase.data.valueRanges[3].values.flat();
    let priceList = dataBase.data.valueRanges[4].values.flat();

    //  Получаем прай-лист
    let textPrice = "";
    for (i = 0; i < serviceList.length; i++) {
      textPrice = textPrice + `${serviceList[i]} - ` + `${priceList[i]}` + "\n";
    }
    //---------------------------------------------
    // Определяем текущую дату из строки 2 с датами

    let columns = 1;
    for (let i = 0; i < dateArr.length; i++) {
      if (
        new Date().getMonth() + 1 + "/" + new Date().getDate() ===
        dateArr[i]
      ) {
        columns = columns + i;
        break;
      }
    }
    // ---------------------------
    let timeCurrentcheck = moment().format();
    let dateCheck = timeCurrentcheck[timeCurrentcheck.length - 14];
    if (dateCheck === "0") {
      dateCheck = Number(timeCurrentcheck[timeCurrentcheck.length - 13]);
    } else {
      dateCheck = Number(
        timeCurrentcheck[timeCurrentcheck.length - 14] +
          timeCurrentcheck[timeCurrentcheck.length - 13]
      );
    }
    //dateCheck = dateCheck + 8

    if (dateCheck > 16) {
      columns = columns + 1;
    }
    //---------------------------
    //Получаем значение текущей даты
    let dataColumn = await gsapi.spreadsheets.values.get({
      spreadsheetId: idSheets,
      range: `${listSheet[0]}!R3C${columns}:R3C${columns + 7}`,
    });
    let dateList = dataColumn.data.values.flat();
    let currentDay = dateList[0];

    let startBot = ["старт", "запись", "Вернуться в начало", "1"];
    let anotherMaster = ["Выбрать другого мастера"];
    let confirmEntry = ["Подтвердить запись"];
    let anotherService = ["Выбрать другую услугу"];
    let anotherDate = ["Выбрать другую дату"];
    let anotherTime = ["Выбрать другое время"];
    let deleteRecord = ["Новая запись", "Удалить запись"];
    let priceButton = ["Прайс лист"];
    let serviceChoice = ["Выбрать услугу", "Выбрать другую услугу"];
    let serviceButton = ["Выбрать услугу"];
    let pointNameClient = ["Указать имя клиента"];
    let clientRecord = ["Записать клиента"];
    let confirmRecordAdmin = ["Подтвердить запись клиента"];
    let recordNewButton = ["Новая запись"];
    // let listSheet = new Array();
    let deleteValues = {
      values: [""],
    };
    let dateListButton;
    let blackList = [];
    //Удаление записи клиента админом ----------------
    removeChoiceAdmin.enter(async (chose) => {
      metaData = await gsapi.spreadsheets.get({
        spreadsheetId: idSheets,
      });

      listSheet = [];
      let sheets = metaData.data.sheets;
      for (let i = 2; i < sheets.length; i++) {
        listSheet.push(metaData.data.sheets[i].properties.title);
      }
      let listSetting = new Array();
      for (i = 0; i < 2; i++) {
        listSetting.push(metaData.data.sheets[i].properties.title);
      }
      let dataBase = await gsapi.spreadsheets.values.batchGet({
        spreadsheetId: idSheets,
        ranges: [
          `${listSetting[0]}!E1:E`,
          `${listSheet[0]}!A4:A`,
          `${listSheet[0]}!3:3`,
          `${listSheet[0]}!2:2`,
          `${listSetting[0]}!G1:G`,
        ],
      });

      let numberRecords = dataBase.data.valueRanges[1].values.length;
      let timeArray = dataBase.data.valueRanges[1].values.flat();
      let dateSheets = dataBase.data.valueRanges[2].values.flat();
      let dateArr = dataBase.data.valueRanges[3].values.flat();
      let adminMessage = dataBase.data.valueRanges[0].values.flat();
      let masterName = dataBase.data.valueRanges[4].values.flat();
      let timeSheets = dataBase.data.valueRanges[1].values.flat();

      await chose.reply(
        "Выберети мастера, у которого нужно удалить запись",
        Markup.keyboard(listSheet).oneTime().resize()
      );

      removeChoiceAdmin.on("message", async (chose) => {
        let checkMessage = chose.update.message.text;
        let buttonDelete = ["Удалить выбранную запись"];

        if (listSheet.includes(checkMessage)) {
          indexMaster = chose.update.message.text;
          // Определяем текущую дату из строки 2 с датами
          let columns = 1;
          for (let i = 0; i < dateArr.length; i++) {
            if (
              new Date().getMonth() + 1 + "/" + new Date().getDate() ===
              dateArr[i]
            ) {
              columns = columns + i;
              break;
            }
          }
          // ---------------------------
          let timeCurrentcheck = moment().format();
          let dateCheck = timeCurrentcheck[timeCurrentcheck.length - 14];
          if (dateCheck === "0") {
            dateCheck = Number(timeCurrentcheck[timeCurrentcheck.length - 13]);
          } else {
            dateCheck = Number(
              timeCurrentcheck[timeCurrentcheck.length - 14] +
                timeCurrentcheck[timeCurrentcheck.length - 13]
            );
          }
          //dateCheck = dateCheck + 8

          if (dateCheck > 16) {
            columns = columns + 1;
          }
          //---------------------------
          //Получаем значение текущей даты
          let dataColumn = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSheet[0]}!R3C${columns}:R3C${columns + 30}`,
          });
          dateList = dataColumn.data.values.flat();
          dateListButton = anotherMaster.concat(dateList);
          currentDay = dateList[0];
          chose.telegram.sendMessage(
            chose.chat.id,
            "Выбран мастер: " +
              `${indexMaster}` +
              "\n" +
              "На какую дату была сделана запись",
            Markup.keyboard(dateListButton).oneTime().resize()
          );
        } else if (anotherMaster.includes(checkMessage)) {
          chose.reply(
            "Выберети мастера, у которого нужно удалить запись",
            Markup.keyboard(listSheet).oneTime().resize()
          );
        } else if (anotherDate.includes(checkMessage)) {
          // Определяем текущую дату из строки 2 с датами
          let columns = 1;
          for (let i = 0; i < dateArr.length; i++) {
            if (
              new Date().getMonth() + 1 + "/" + new Date().getDate() ===
              dateArr[i]
            ) {
              columns = columns + i;
              break;
            }
          }
          // ---------------------------
          let timeCurrentcheck = moment().format();
          let dateCheck = timeCurrentcheck[timeCurrentcheck.length - 14];
          if (dateCheck === "0") {
            dateCheck = Number(timeCurrentcheck[timeCurrentcheck.length - 13]);
          } else {
            dateCheck = Number(
              timeCurrentcheck[timeCurrentcheck.length - 14] +
                timeCurrentcheck[timeCurrentcheck.length - 13]
            );
          }
          //dateCheck = dateCheck + 8

          if (dateCheck > 16) {
            columns = columns + 1;
          }
          //---------------------------
          //Получаем значение текущей даты
          dataColumn = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSheet[0]}!R3C${columns}:R3C${columns + 30}`,
          });
          dateList = dataColumn.data.values.flat();
          dateListButton = anotherMaster.concat(dateList);
          currentDay = dateList[0];
          chose.telegram.sendMessage(
            chose.chat.id,
            "Выбран мастер: " +
              `${indexMaster}` +
              "\n" +
              "Выберите дату, на которую была сделана запись",
            Markup.keyboard(dateListButton).oneTime().resize()
          );
        } else if (currentDay.includes(checkMessage)) {
          indexDate = chose.update.message.text;
          let timeCurrent = moment().format();
          let timeCheck = timeCurrent[timeCurrent.length - 14];
          if (timeCheck === "0") {
            timeCheck = Number(timeCurrent[timeCurrent.length - 13]);
          } else {
            timeCheck = Number(
              timeCurrent[timeCurrent.length - 14] +
                timeCurrent[timeCurrent.length - 13]
            );
          }
          if (timeCheck >= 16) {
            timeCheck = 8;
          } else {
            timeCheck = timeCheck + 8;
          }

          let time = "";
          let row = 0;
          for (i = 0; i < timeSheets.length; i++) {
            if (timeSheets[i][0] === "1") {
              time = timeSheets[i][0] + timeSheets[i][1];
              row = row + 1;
            } else {
              time = timeSheets[i][0];
              row = row + 1;
            }

            if (Number(time) === timeCheck) {
              break;
            }
          }

          let column = 1;
          for (let i = 0; i < dateArr.length; i++) {
            if (indexDate === dateSheets[i]) {
              column = column + i;
              break;
            }
          }
          // Определили колонку с выбранной датой
          indexColumn = column;
          //console.log(column);
          let timeColumn = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${indexMaster}!R4C${column}:R${
              numberRecords + 4
            }C${column}`,
          });

          //Определяем занятое время
          let timeArr = [];
          for (i = row + 2; i < numberRecords; i++) {
            if (timeColumn.data.values[i] == "") {
            } else {
              let itemss = timeArray[i];
              timeArr = timeArr.concat(itemss);
            }
          }
          //Добавлем к массиву времени возврат к дате
          let items = timeArr;
          let itemsDop = ["Выбрать другую дату"];
          Array.prototype.push.apply(items, itemsDop);

          chose.telegram.sendMessage(
            chose.chat.id,
            "Выбрана дата: " +
              `${indexDate}` +
              "\nНа какое время была сделана запись?",
            Markup.keyboard(items).oneTime().resize()
          );
        } else if (dateList.includes(checkMessage)) {
          indexDate = chose.update.message.text;
          let column = 1;
          for (let i = 0; i < dateArr.length; i++) {
            if (indexDate === dateSheets[i]) {
              column = column + i;
              break;
            }
          }

          // Определили колонку с выбранной датой
          indexColumn = column;
          console.log(column);
          let timeColumn = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${indexMaster}!R4C${column}:R${
              numberRecords + 4
            }C${column}`,
          });
          //Определяем занятое время
          let timeArr = [];
          for (i = 0; i < numberRecords; i++) {
            if (timeColumn.data.values[i] == "") {
            } else {
              let itemss = timeArray[i];
              timeArr = timeArr.concat(itemss);
            }
          }
          //Добавлем к массиву времени возврат к дате
          let items = timeArr;
          let itemsDop = ["Выбрать другую дату"];
          Array.prototype.push.apply(items, itemsDop);
          chose.telegram.sendMessage(
            chose.chat.id,
            "Выбрана дата: " +
              `${indexDate}` +
              "\nНа какое время была сделана запись?",
            Markup.keyboard(items).oneTime().resize()
          );
        } else if (anotherTime.includes(checkMessage)) {
          let column = 1;
          for (let i = 0; i < dateArr.length; i++) {
            if (indexDate === dateSheets[i]) {
              column = column + i;
              break;
            }
          }
          // Определили колонку с выбранной датой
          indexColumn = column;

          let timeColumn = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${indexMaster}!R4C${column}:R${
              numberRecords + 4
            }C${column}`,
          });

          //Определяем занятое время
          let timeArr = [];
          for (i = 0; i < numberRecords; i++) {
            if (timeColumn.data.values[i] == "") {
            } else {
              let itemss = timeArray[i];
              timeArr = timeArr.concat(itemss);
            }
          }
          //Добавлем к массиву времени возврат к дате
          let items = timeArr;
          let itemsDop = ["Выбрать другую дату"];
          Array.prototype.push.apply(items, itemsDop);

          chose.telegram.sendMessage(
            chose.chat.id,
            "Выбрана дата: " +
              `${indexDate}` +
              "\nНа какое время была сделана запись?",
            Markup.keyboard(items).oneTime().resize()
          );
        } else if (timeArray.includes(checkMessage)) {
          indexTime = chose.update.message.text;
          //Определяем строку записи по выбранному времени из всего массива времени
          let rowTime = 4;
          for (i = 0; i < timeArray.length; i++) {
            if (indexTime == timeArray[i]) {
              rowTime = rowTime + i;
              indexRow = rowTime;
              break;
            }
          }
          let buttonTime = ["Удалить выбранную запись", "Выбрать другое время"];

          chose.telegram.sendMessage(
            chose.chat.id,
            "Запись, выбранная для удаления: \nМастер: " +
              `${indexMaster}` +
              "\nДата записи: " +
              `${indexDate}` +
              "\nВремя записи: " +
              `${indexTime}`,
            Markup.keyboard(buttonTime).oneTime().resize()
          );
        } else if (buttonDelete.includes(checkMessage)) {
          let RecordDelete = {
            values: [""],
          };
          const updateOptions = {
            spreadsheetId: idSheets,
            range: `${indexMaster}!R${indexRow}C${indexColumn}:R${indexRow}C${indexColumn}`,
            valueInputOption: "USER_ENTERED",
            resource: { values: RecordDelete },
          };
          await gsapi.spreadsheets.values.update(updateOptions);

          //Оповещение администраторов
          for (let m = 1; m < adminMessage.length; m++) {
            chose.telegram.sendMessage(
              adminMessage[m],
              "Удалена запись:\nМастер: " +
                `${indexMaster}` +
                "\nДата записи: " +
                `${indexDate}` +
                "\nВремя записи: " +
                `${indexTime}`,
              Markup.keyboard(adminMenu).oneTime().resize()
            );
          }
          //Оповещение мастера
          for (let m = 1; m < masterName.length; m++) {
            if (`${masterName[m]}` == `${indexMaster}`) {
              let masterIdArr = await gsapi.spreadsheets.values.get({
                spreadsheetId: idSheets,
                range: `${listSetting[0]}!F1:F`,
              });
              let masterId = masterIdArr.data.values.flat()[m];
              chose.telegram.sendMessage(
                masterId,
                "Удалена запись: " +
                  "\nДата записи: " +
                  `${indexDate}` +
                  "\nВремя записи: " +
                  `${indexTime}`
              );
              break;
            }
          }
          return chose.scene.leave();
        } else {
          return;
        }
      });
    });

    //Начальная сцена (команда /start)
    startScene.enter(async (ctx) => {
      nameClient = ctx.chat.first_name;
      idClient = ctx.chat.id;
      let check = ctx.chat.id.toString();
      let metaData = await gsapi.spreadsheets.get({
        spreadsheetId: idSheets,
      });
      // Формируем список первых двух рабочих листов
      let listSetting = new Array();
      for (i = 0; i < 2; i++) {
        listSetting.push(metaData.data.sheets[i].properties.title);
      }
      let dataBaseStart = await gsapi.spreadsheets.values.batchGet({
        spreadsheetId: idSheets,
        ranges: [
          `${listSetting[0]}!D1:D`,
          //  `${listSheet[0]}!A4:A`,
          //  `${listSheet[0]}!3:3`,
          //  `${listSheet[0]}!2:2`,
          `${listSetting[0]}!A1:A`,
        ],
      });
      // Формируем черный список
      let blackList = dataBaseStart.data.valueRanges[0].values.flat();
      numberClient = dataBaseStart.data.valueRanges[1].values.length;

      if (blackList.includes(check)) {
        return ctx.scene.leave();
      }

      if (
        dataBaseStart.data.valueRanges[1].values.flat().includes(`${idClient}`)
      ) {
        ctx.reply("Приветствуем вас " + `${nameClient}`) + ". ";
        ctx.reply(
          'Для записи на услугу нажмите на кнопку "Новая запись" или напишите сообщение "запись" (пишем без кавычек)',
          Markup.keyboard(recordNewButton).oneTime().resize()
        );
        return ctx.scene.leave();
      } else {
        await ctx.reply(
          "Приветствуем вас " + `${nameClient}` + ". Введите ваш номер телефона"
        );
        startScene.on("message", async (ctx) => {
          let indexPhone = ctx.update.message.text;
          let reg =
            /^(\+)?((\d{2,3}) ?\d|\d)(([ -]?\d)|( ?(\d{2,3}) ?)){5,12}\d$/;
          if (
            reg.test(indexPhone) &&
            indexPhone.length <= 11 &&
            indexPhone.length >= 10
          ) {
            idClient = ctx.chat.id;
            nameClient = ctx.chat.first_name;
            ctx.reply(
              'Отлично. Для записи на услугу нажмите на кнопку "Новая запись" или напишите сообщение "запись" (пишем без кавычек)',
              Markup.keyboard(recordNewButton).oneTime().resize()
            );
            let dateRecord = {
              values: [`${idClient}`, `${nameClient}`, `${indexPhone}`],
            };
            const updateOptions = {
              spreadsheetId: idSheets,
              range: `${listSetting[0]}!R${numberClient + 1}C1:R${
                numberClient + 1
              }C3`,
              valueInputOption: "USER_ENTERED",
              resource: { values: dateRecord },
            };
            await gsapi.spreadsheets.values.update(updateOptions);
            return ctx.scene.leave();
          } else {
            ctx.reply(
              "Номер введен в неверном формате. Введите номер телефона правильно"
            );
          }
        });
      }
    });
    //Добавление в черный список -------------------
    black.enter(async (chose) => {
      let metaData = await gsapi.spreadsheets.get({
        spreadsheetId: idSheets,
      });
      // Формируем список первых двух рабочих листов
      let listSetting = new Array();
      for (i = 0; i < 2; i++) {
        listSetting.push(metaData.data.sheets[i].properties.title);
      }
      //Проверям на админство
      let dataBaseBlackList = await gsapi.spreadsheets.values.batchGet({
        spreadsheetId: idSheets,
        ranges: [`${listSetting[0]}!E1:E`, `${listSetting[0]}!D1:D`],
      });
      let checkId = chose.chat.id.toString();
      let adminChatIdArr = dataBaseBlackList.data.valueRanges[0].values.flat();
      //let numberRowBlackList =
      //  dataBaseBlackList.data.valueRanges[1].values.length;
      if (!adminChatIdArr.includes(checkId)) {
        chose.reply(
          'Неизвестная команда. Сделайте выбор по кнопкам, либо напишите слово "старт" или "запись". Пишем без кавычек'
        );
        return chose.scene.leave();
      }

      checkList = await gsapi.spreadsheets.values.get({
        spreadsheetId: idSheets,
        range: `${listSetting[0]}!D1:D`,
      });
      numberClient = checkList.data.values.length;
      await bot.telegram.sendMessage(
        chose.chat.id,
        "Введите id, блокируемого пользователя. ID можно посмотреть либо в ваших оповещениях, либо в гугл таблице "
      );
      black.on("message", async (chose) => {
        let indexIDBlack = chose.update.message.text;
        let regID = /^[1-9]+[0-9]*$/;
        if (regID.test(indexIDBlack)) {
          let RecordBlackId = {
            values: [`${indexIDBlack}`],
          };
          const updateOptions = {
            spreadsheetId: idSheets,
            range: `${listSetting[0]}!D${numberClient + 1}:D${
              numberClient + 1
            }`,
            valueInputOption: "USER_ENTERED",
            resource: { values: RecordBlackId },
          };
          await gsapi.spreadsheets.values.update(updateOptions);
          chose.reply("ID внесен в черный список в таблицу");
          return chose.scene.leave();
        } else {
          await chose.reply(
            "Номер ID введен в неверном формате. Введите номер правильно"
          );
        }
      });
    });
    //End черный список

    //  Тело самого бота (работа с клиентом)
    recordClient.enter(async (chose) => {
      let checkMessage = chose.message.text;
      nameClient = chose.chat.first_name;
      let check = chose.chat.id.toString();
      chose.reply("...");

      let metaData = await gsapi.spreadsheets.get({
        spreadsheetId: idSheets,
      });

      // Формируем список первых двух рабочих листов
      let listSetting = new Array();
      for (i = 0; i < 2; i++) {
        listSetting.push(metaData.data.sheets[i].properties.title);
      }
      listSheet = [];
      for (let i = 2; i < metaData.data.sheets.length; i++) {
        listSheet.push(metaData.data.sheets[i].properties.title);
      }
      listSheetButton = listSheet.concat(anotherService);
      // Получаем данные из таблицы оодним запросом -------------------------------------------------------------------
      let dataBase = await gsapi.spreadsheets.values.batchGet({
        spreadsheetId: idSheets,
        ranges: [
          `${listSetting[1]}!A2:A`,
          `${listSheet[0]}!A4:A`,
          `${listSheet[0]}!3:3`,
          `${listSheet[0]}!2:2`,
          `${listSetting[1]}!B2:B`,
          `${listSetting[0]}!D1:D`,
        ],
      });
      // Проверяем на черный список
      serviceList = dataBase.data.valueRanges[0].values.flat();
      let numberRecords = dataBase.data.valueRanges[1].values.length;
      let timeArray = dataBase.data.valueRanges[1].values.flat();
      let dateSheets = dataBase.data.valueRanges[2].values.flat();
      let dateArr = dataBase.data.valueRanges[3].values.flat();
      let priceList = dataBase.data.valueRanges[4].values.flat();
      let blackList = dataBase.data.valueRanges[5].values.flat();

      //  Получаем прай-лист
      let textPrice = "";
      for (i = 0; i < serviceList.length; i++) {
        textPrice =
          textPrice +
          `✅ ${serviceList[i]} - ` +
          `${priceList[i]} рублей` +
          "\n";
      }
      // Определяем текущую дату из строки 2 с датами
      let columns = 1;
      for (let i = 0; i < dateArr.length; i++) {
        if (
          new Date().getMonth() + 1 + "/" + new Date().getDate() ===
          dateArr[i]
        ) {
          columns = columns + i;
          break;
        }
      }
      // ---------------------------
      let timeCurrentcheck = moment().format();
      let dateCheck = timeCurrentcheck[timeCurrentcheck.length - 14];
      if (dateCheck === "0") {
        dateCheck = Number(timeCurrentcheck[timeCurrentcheck.length - 13]);
      } else {
        dateCheck = Number(
          timeCurrentcheck[timeCurrentcheck.length - 14] +
            timeCurrentcheck[timeCurrentcheck.length - 13]
        );
      }
      //dateCheck = dateCheck + 8

      if (dateCheck > 16) {
        columns = columns + 1;
      }
      //---------------------------
      //Получаем значение текущей даты
      dataColumn = await gsapi.spreadsheets.values.get({
        spreadsheetId: idSheets,
        range: `${listSheet[0]}!R3C${columns}:R3C${columns + 30}`,
      });
      dateList = dataColumn.data.values.flat();
      dateListButton = anotherMaster.concat(dateList);
      currentDay = dateList[0];

      if (blackList.includes(check)) {
        return chose.scene.leave();
      } else if (recordNewButton.includes(checkMessage)) {
        Array.prototype.push.apply(serviceList, priceButton);

        chose.telegram.sendMessage(
          chose.chat.id,
          "Выберите на какую услугу вас записать",
          Markup.keyboard(serviceList).oneTime().resize()
        );
      } else if (startBot.includes(checkMessage)) {
        chose.telegram.sendMessage(
          chose.chat.id,
          "Приветствуем вас " + `${nameClient}` + ". "
        );
        Array.prototype.push.apply(serviceList, priceButton);

        chose.telegram.sendMessage(
          chose.chat.id,
          "Выберите на какую услугу вас записать 👇",
          Markup.keyboard(serviceList).oneTime().resize()
        );
      }

      recordClient.on("message", async (chose) => {
        checkMessage = chose.message.text;
        let metaData = await gsapi.spreadsheets.get({
          spreadsheetId: idSheets,
        });

        // Формируем список первых двух рабочих листов
        let listSetting = new Array();
        for (i = 0; i < 2; i++) {
          listSetting.push(metaData.data.sheets[i].properties.title);
        }
        listSheet = [];
        for (let i = 2; i < metaData.data.sheets.length; i++) {
          listSheet.push(metaData.data.sheets[i].properties.title);
        }
        listSheetButton = listSheet.concat(anotherService);
        // Получаем данные из таблицы оодним запросом -------------------------------------------------------------------
        let dataBase = await gsapi.spreadsheets.values.batchGet({
          spreadsheetId: idSheets,
          ranges: [
            `${listSetting[1]}!A2:A`,
            `${listSheet[0]}!A4:A`,
            `${listSheet[0]}!3:3`,
            `${listSheet[0]}!2:2`,
            `${listSetting[1]}!B2:B`,
            `${listSetting[0]}!D1:D`,
          ],
        });
        // Проверяем на черный список
        let serviceList = dataBase.data.valueRanges[0].values.flat();
        let numberRecords = dataBase.data.valueRanges[1].values.length;
        let timeArray = dataBase.data.valueRanges[1].values.flat();
        let dateSheets = dataBase.data.valueRanges[2].values.flat();
        let dateArr = dataBase.data.valueRanges[3].values.flat();
        let priceList = dataBase.data.valueRanges[4].values.flat();
        let blackList = dataBase.data.valueRanges[5].values.flat();

        //  Получаем прай-лист
        let textPrice = "";
        for (i = 0; i < serviceList.length; i++) {
          textPrice =
            textPrice +
            `✅ ${serviceList[i]} - ` +
            `${priceList[i]} рублей` +
            "\n";
        }

        if (blackList.includes(check)) {
          return chose.scene.leave();
        } else if (priceButton.includes(checkMessage)) {
          chose.telegram.sendMessage(
            chose.chat.id,
            textPrice,
            Markup.keyboard(serviceButton).oneTime().resize()
          );
        } else if (serviceChoice.includes(checkMessage)) {
          nameClient = chose.chat.first_name;
          chose.telegram.sendMessage(
            chose.chat.id,
            "Выберите на какую услугу вас записать",
            Markup.keyboard(serviceList).oneTime().resize()
          );
        } else if (serviceList.includes(checkMessage)) {
          indexService = chose.update.message.text;
          chose.telegram.sendMessage(
            chose.chat.id,
            "К какому мастеру вас записать",
            Markup.keyboard(listSheetButton).oneTime().resize()
          );
        } else if (anotherMaster.includes(checkMessage)) {
          chose.telegram.sendMessage(
            chose.chat.id,
            "Выберите другого мастера:",
            Markup.keyboard(listSheetButton).oneTime().resize()
          );
        } else if (listSheet.includes(checkMessage)) {
          indexMaster = chose.update.message.text;
          // Определяем текущую дату из строки 2 с датами
          dataSheets = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSheet[0]}!2:2`,
          });
          dateArr = dataSheets.data.values.flat();
          let columns = 1;
          for (let i = 0; i < dateArr.length; i++) {
            if (
              new Date().getMonth() + 1 + "/" + new Date().getDate() ===
              dateArr[i]
            ) {
              columns = columns + i;
              break;
            }
          }
          // ---------------------------
          let timeCurrentcheck = moment().format();
          let dateCheck = timeCurrentcheck[timeCurrentcheck.length - 14];
          if (dateCheck === "0") {
            dateCheck = Number(timeCurrentcheck[timeCurrentcheck.length - 13]);
          } else {
            dateCheck = Number(
              timeCurrentcheck[timeCurrentcheck.length - 14] +
                timeCurrentcheck[timeCurrentcheck.length - 13]
            );
          }
          //dateCheck = dateCheck + 8

          if (dateCheck > 16) {
            columns = columns + 1;
          }
          //---------------------------
          //Получаем значение текущей даты
          dataColumn = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSheet[0]}!R3C${columns}:R3C${columns + 30}`,
          });
          dateList = dataColumn.data.values.flat();
          dateListButton = anotherMaster.concat(dateList);
          currentDay = dateList[0];
          chose.telegram.sendMessage(
            chose.chat.id,
            "Вы выбрали мастера: " +
              `${indexMaster}` +
              "\n" +
              "На какую дату вас записать?",
            Markup.keyboard(dateListButton).oneTime().resize()
          );
        } else if (anotherDate.includes(checkMessage)) {
          chose.telegram.sendMessage(
            chose.chat.id,
            "Вы выбрали мастера: " +
              `${indexMaster}` +
              "\n" +
              "Посмотрите другую дату:",
            Markup.keyboard(dateListButton).oneTime().resize()
          );
        } else if (checkMessage == currentDay) {
          // console.log("Я в текущей дате");
          indexDate = chose.update.message.text;

          let timeCurrent = moment().format();

          let dateCheck = timeCurrent[timeCurrent.length - 14];
          if (dateCheck === "0") {
            dateCheck = Number(timeCurrent[timeCurrent.length - 13]);
          } else {
            dateCheck = Number(
              timeCurrent[timeCurrent.length - 14] +
                timeCurrent[timeCurrent.length - 13]
            );
          }
          // if (dateCheck >= 16) {
          //   dateCheck = 8;
          // } else {
          //   dateCheck = dateCheck + 8;
          // }

          console.log(dateCheck);
          let numberRecordsArr = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSheet[0]}!A4:A`,
          });
          numberRecords = numberRecordsArr.data.values.length;
          let dateSheetsArr = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSheet[0]}!3:3`,
          });
          dateSheets = dateSheetsArr.data.values.flat();
          timeArray = numberRecordsArr.data.values.flat();

          let timeSheets = numberRecordsArr.data.values.flat();
          let time = "";
          let row = 0;
          for (i = 0; i < timeSheets.length; i++) {
            if (timeSheets[i][0] === "1") {
              time = timeSheets[i][0] + timeSheets[i][1];
              //  console.log(Number(time));
              row = row + 1;
            } else {
              time = timeSheets[i][0];
              //  console.log(Number(time));
              row = row + 1;
            }

            if (Number(time) === Number(dateCheck)) {
              //  console.log(row);
              break;
            }
          }
          // Определим колонку с текущей датой
          let column = 1;
          for (let i = 0; i < dateArr.length; i++) {
            if (indexDate === dateSheets[i]) {
              column = column + i;
              break;
            }
          }

          indexColumn = column;
          //console.log(column);
          let timeColumn = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${indexMaster}!R4C${column}:R${
              numberRecords + 4
            }C${column}`,
          });
          //console.log(timeColumn);
          //Определяем свободное время
          let timeArr = [];
          for (i = row + 2; i < numberRecords + 4; i++) {
            if (timeColumn.data.values[i] == "") {
              let itemss = timeArray[i];
              timeArr = timeArr.concat(itemss);
            }
          }
          //Добавлем к массиву времени возврат к дате
          let items = timeArr;
          let itemsDop = ["Выбрать другую дату"];
          Array.prototype.push.apply(items, itemsDop);
          //let dateList = dataColumn.data.values.flat();
          chose.telegram.sendMessage(
            chose.chat.id,
            "Вы выбрали дату: " +
              `${indexDate}` +
              ". \n На какое время вас записать?",
            Markup.keyboard(items).oneTime().resize()
          );
          //});
        } else if (dateList.includes(checkMessage)) {
          indexDate = chose.update.message.text;
          let numberRecordsArr = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSheet[0]}!A4:A`,
          });
          numberRecords = numberRecordsArr.data.values.length;
          let dateSheetsArr = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSheet[0]}!3:3`,
          });
          dateSheets = dateSheetsArr.data.values.flat();
          timeArray = numberRecordsArr.data.values.flat();
          let column = 1;
          for (let i = 0; i < dateArr.length; i++) {
            if (indexDate === dateSheets[i]) {
              column = column + i;
              break;
            }
          }

          // Определили колонку с выбранной датой
          indexColumn = column;
          //console.log(column);
          let timeColumn = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${indexMaster}!R4C${column}:R${
              numberRecords + 4
            }C${column}`,
          });

          //Определяем свободное время
          let timeArr = [];
          for (i = 0; i < numberRecords + 4; i++) {
            if (timeColumn.data.values[i] == "") {
              let itemss = timeArray[i];
              timeArr = timeArr.concat(itemss);
            }
          }
          //Добавлем к массиву времени возврат к дате
          let items = timeArr;
          let itemsDop = ["Выбрать другую дату"];
          Array.prototype.push.apply(items, itemsDop);
          //let dateList = dataColumn.data.values.flat();
          chose.telegram.sendMessage(
            chose.chat.id,
            "Вы выбрали дату: " +
              `${indexDate}` +
              ". \n На какое время вас записать?",
            Markup.keyboard(items).oneTime().resize()
          );
          //});
        } else if (anotherTime.includes(checkMessage)) {
          //console.log("Я тут");
          //indexDate = chose.update.message.text;
          let column = 1;
          for (let i = 0; i < dateArr.length; i++) {
            if (indexDate === dateSheets[i]) {
              column = column + i;
              break;
            }
          }
          // Определили колонку с выбранной датой
          //console.log(column);
          indexColumn = column;

          let timeColumn = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${indexMaster}!R4C${column}:R${
              numberRecords + 4
            }C${column}`,
          });

          //Определяем свободное время
          let timeArr = [];
          for (i = 0; i < numberRecords + 4; i++) {
            if (timeColumn.data.values[i] == "") {
              let itemss = timeArray[i];
              timeArr = timeArr.concat(itemss);
            }
          }
          //Добавлем к массиву времени возврат к дате
          let items = timeArr;
          let itemsDop = ["Выбрать другую дату"];
          Array.prototype.push.apply(items, itemsDop);
          //let dateList = dataColumn.data.values.flat();
          chose.telegram.sendMessage(
            chose.chat.id,
            "Вы выбрали дату: " +
              `${indexDate}` +
              ". \n Выберите другое свободное время.",
            Markup.keyboard(items).oneTime().resize()
          );
          //});
        } else if (timeArray.includes(checkMessage)) {
          indexTime = chose.update.message.text;

          let rowTime = 4;
          for (i = 0; i < timeArray.length; i++) {
            if (indexTime == timeArray[i]) {
              rowTime = rowTime + i;
              indexRow = rowTime;
              break;
            }
          }
          let buttonTime = [
            "Подтвердить запись",
            //"Вернуться в начало",
            "Выбрать другое время",
          ];

          chose.telegram.sendMessage(
            chose.chat.id,
            "Вы выбрали: \nМастер: " +
              `${indexMaster}` +
              "\nУслуга: " +
              `${indexService}` +
              "\nДата записи: " +
              `${indexDate}` +
              "\nВремя записи: " +
              `${indexTime}`,
            Markup.keyboard(buttonTime).oneTime().resize()
          );
        } else if (confirmEntry.includes(checkMessage)) {
          // Проверка свободно время или нет
          let checkFreeArr = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${indexMaster}!R${indexRow}C${indexColumn}:R${indexRow}C${indexColumn}`,
          });
          let checkFree = checkFreeArr.data.values;
          if (checkFree === undefined) {
            // Запись в таблицу
            let idListArr = await gsapi.spreadsheets.values.get({
              spreadsheetId: idSheets,
              range: `${listSetting[0]}!A2:A`,
            });
            let idList = idListArr.data.values.flat();
            let checkIdClient;
            // let scoreId = 0;
            for (i = 0; i < idList.length; i++) {
              checkIdClient = idList[i];
              if (checkIdClient == chose.chat.id) {
                scoreId = i;
                break;
              }
            }

            let indexPhoneArr = await gsapi.spreadsheets.values.get({
              spreadsheetId: idSheets,
              range: `${listSetting[0]}!R${scoreId + 2}C3:R${scoreId + 2}C3`,
            });
            indexPhone = indexPhoneArr.data.values.flat();

            let dateRecord = {
              values: [
                "Клиент: " +
                  `${nameClient}` +
                  "\nУслуга: " +
                  `${indexService}` +
                  "\nТелефон: " +
                  `${indexPhone}`,
              ],
            };
            const updateOptions = {
              spreadsheetId: idSheets,
              range: `${indexMaster}!R${indexRow}C${indexColumn}:R${indexRow}C${indexColumn}`,
              valueInputOption: "USER_ENTERED",
              resource: { values: dateRecord },
            };
            await gsapi.spreadsheets.values.update(updateOptions);

            chose.telegram.sendMessage(
              chose.chat.id,
              "Отлично. Вы записаны:\nМастер: " +
                `${indexMaster}` +
                "\nУслуга: " +
                `${indexService}` +
                "\nДата записи: " +
                `${indexDate}` +
                "\nВремя записи:" +
                `${indexTime}`,
              Markup.keyboard(deleteRecord).oneTime().resize()
            );
            //Оповещение администраторов
            adminChatIdArr = await gsapi.spreadsheets.values.get({
              spreadsheetId: idSheets,
              range: `${listSetting[0]}!E1:E`,
            });
            let adminMessage = adminChatIdArr.data.values.flat();
            for (let m = 1; m < adminMessage.length; m++) {
              chose.telegram.sendMessage(
                adminMessage[m],
                "Появилась новая запись:\nМастер: " +
                  `${indexMaster}` +
                  "\nКлиент: " +
                  `${nameClient}` +
                  "\nУслуга: " +
                  `${indexService}` +
                  "\nДата записи: " +
                  `${indexDate}` +
                  "\nВремя записи:" +
                  `${indexTime}` +
                  "\nТелефон: " +
                  `${indexPhone}` +
                  "\nID: " +
                  `${chose.chat.id}`
              );
            }
            //Оповещение мастера
            let masterNameArr = await gsapi.spreadsheets.values.get({
              spreadsheetId: idSheets,
              range: `${listSetting[0]}!G1:G`,
            });
            let masterName = masterNameArr.data.values.flat();
            for (let m = 1; m < masterName.length; m++) {
              if (`${masterName[m]}` == `${indexMaster}`) {
                let masterIdArr = await gsapi.spreadsheets.values.get({
                  spreadsheetId: idSheets,
                  range: `${listSetting[0]}!F1:F`,
                });
                let masterId = masterIdArr.data.values.flat()[m];
                chose.telegram.sendMessage(
                  masterId,
                  "Появилась новая запись: " +
                    "\nКлиент: " +
                    `${nameClient}` +
                    "\nУслуга: " +
                    `${indexService}` +
                    "\nДата записи: " +
                    `${indexDate}` +
                    "\nВремя записи:" +
                    `${indexTime}`
                );
                break;
              }
            }
            //Рабочая запись (первый лист) в таблицу текущей записи клиента
            let clientBaseIdAr = await gsapi.spreadsheets.values.get({
              spreadsheetId: idSheets,
              range: `${listSetting[0]}!A1:A`,
            });
            let clientBaseId = clientBaseIdAr.data.values.flat();
            for (let n = 1; n < clientBaseId.length; n++) {
              if (`${clientBaseId[n]}` == `${chose.chat.id}`) {
                let dateRecordClientTable = {
                  values: [
                    `${nameClient}`,
                    `${indexDate}`,
                    `${indexTime}`,
                    `${indexMaster}`,
                    `${indexService}`,
                    `${indexRow}`,
                    `${indexColumn}`,
                  ],
                };
                const updateOptions1 = {
                  spreadsheetId: idSheets,
                  range: `${listSetting[0]}!R${n + 1}C8:R${n + 1}C14`,
                  valueInputOption: "USER_ENTERED",
                  resource: { values: dateRecordClientTable },
                };
                await gsapi.spreadsheets.values.update(updateOptions1);
                break;
              }
            }
            //Настройка оповещения клиента за час
            let mmsHours = 3600000;
            let timeZone = 8;
            let dateRec = indexDate[indexDate.length - 5];
            if (dateRec === "0") {
              dateRec = indexDate[indexDate.length - 4];
            } else {
              dateRec =
                indexDate[indexDate.length - 5] +
                indexDate[indexDate.length - 4];
            }

            let monthRec = indexDate[indexDate.length - 2];
            if (monthRec === "0") {
              monthRec = indexDate[indexDate.length - 1] - 1;
            } else {
              monthRec =
                indexDate[indexDate.length - 2] +
                indexDate[indexDate.length - 1] -
                1;
            }

            let minutesRec =
              indexTime[indexTime.length - 2] + indexTime[indexTime.length - 1];
            if (minutesRec === "0") {
              minutesRec = 0;
            }
            let hoursRec = indexTime[indexTime.length - 5];
            if (hoursRec === undefined) {
              hoursRec = Number(indexTime[indexTime.length - 4]) + timeZone;
              //  console.log("ok");
            } else {
              hoursRec =
                Number(
                  indexTime[indexTime.length - 5] +
                    indexTime[indexTime.length - 4]
                ) + timeZone;
            }

            let currentYear = new Date().getFullYear();
            let currentDate = Date.now() + mmsHours * (timeZone - 1);
            let dateRecordsMM = new Date(
              currentYear,
              monthRec,
              dateRec,
              hoursRec,
              minutesRec
            );
            let intervalTime = dateRecordsMM - currentDate - mmsHours * 10;
            console.log(intervalTime);
            if (intervalTime > 0) {
              setTimeout(async () => {
                let clientBaseIdAr = await gsapi.spreadsheets.values.get({
                  spreadsheetId: idSheets,
                  range: `${listSetting[0]}!A1:A`,
                });
                let clientBaseId = clientBaseIdAr.data.values.flat();
                for (let n = 0; n < clientBaseId.length; n++) {
                  if (`${clientBaseId[n]}` == `${chose.chat.id}`) {
                    let clientLastRecords = await gsapi.spreadsheets.values.get(
                      {
                        spreadsheetId: idSheets,
                        range: `${listSetting[0]}!H${n + 1}:N${n + 1}`,
                      }
                    );
                    let nameClient = clientLastRecords.data.values.flat()[0];
                    let indexMaster = clientLastRecords.data.values.flat()[3];
                    let indexService = clientLastRecords.data.values.flat()[4];
                    let indexDate = clientLastRecords.data.values.flat()[1];
                    let indexTime = clientLastRecords.data.values.flat()[2];
                    if (nameClient == "") {
                      //  chose.reply("Оповещение не отправлено")
                      return chose.scene.leave();
                      // break
                    } else {
                      chose.telegram.sendMessage(
                        chose.chat.id,
                        "Приветсвуем вас " +
                          `${nameClient}` +
                          ". Напоминаем вам, что Вы записаны на сегодня:\nМастер: " +
                          `${indexMaster}` +
                          "\nУслуга: " +
                          `${indexService}` +
                          "\nДата записи: " +
                          `${indexDate}` +
                          "\nВремя записи: " +
                          `${indexTime}`,
                        Markup.keyboard(deleteRecord).oneTime().resize()
                      );
                    }
                    break;
                  }
                }
              }, intervalTime);
            }
            return chose.scene.leave();
          } else {
            chose.telegram.sendMessage(
              chose.chat.id,
              "К сожалению это время уже забронировали. Вы выбрали дату: " +
                `${indexDate}` +
                ". \nВыберите другое свободное время",
              Markup.keyboard(anotherTime).oneTime().resize()
            );
          }
        } else {
          chose.telegram.sendMessage(
            chose.chat.id,
            'Неизвестная команда ☝️. Сделайте выбор по кнопке "Новая запись", либо напишите слово "старт" или "запись". Пишем без кавычек',
            Markup.keyboard(recordNewButton).oneTime().resize()
          );
          return chose.scene.leave();
        }
      });
    });
    //-----------Конец записи клиента

    // ------------ Запись клиента админом------------------------
    bot.on("message", async (chose) => {
      let checkMessage = chose.message.text;
      let changeService = ["Заменить услугу"];

      if (clientRecord.includes(checkMessage)) {
        metaData = await gsapi.spreadsheets.get({
          spreadsheetId: idSheets,
        });
        // Формируем список первых двух рабочих листов

        let listSetting = new Array();
        for (i = 0; i < 2; i++) {
          listSetting.push(metaData.data.sheets[i].properties.title);
        }

        // Наши услуги
        let serviceListArr = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${listSetting[1]}!A2:A`,
        });
        serviceList = serviceListArr.data.values.flat();
        chose.telegram.sendMessage(
          chose.chat.id,
          "На какую услугу записать клиента",
          Markup.keyboard(serviceList).oneTime().resize()
        );
      } else if (serviceList.includes(checkMessage)) {
        listSheet = [];
        sheets = metaData.data.sheets;
        for (let i = 2; i < sheets.length; i++) {
          listSheet.push(metaData.data.sheets[i].properties.title);
        }

        listSheetButton = listSheet.concat(changeService);
        indexService = chose.update.message.text;
        chose.telegram.sendMessage(
          chose.chat.id,
          "К какому мастеру записать клиента",
          Markup.keyboard(listSheetButton).oneTime().resize()
        );
      } else if (changeService.includes(checkMessage)) {
        chose.telegram.sendMessage(
          chose.chat.id,
          "Выберите другую услугу для клиента",
          Markup.keyboard(serviceList).oneTime().resize()
        );
      } else if (anotherMaster.includes(checkMessage)) {
        chose.telegram.sendMessage(
          chose.chat.id,
          "Выберите мастера для клиента:",
          Markup.keyboard(listSheetButton).oneTime().resize()
        );
      } else if (listSheet.includes(checkMessage)) {
        indexMaster = chose.update.message.text;
        // Определяем текущую дату из строки 2 с датами
        dataSheets = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${listSheet[0]}!2:2`,
        });
        dateArr = dataSheets.data.values.flat();
        let columns = 1;
        for (let i = 0; i < dateArr.length; i++) {
          if (
            new Date().getMonth() + 1 + "/" + new Date().getDate() ===
            dateArr[i]
          ) {
            columns = columns + i;
            break;
          }
        }
        // ---------------------------
        let timeCurrentcheck = moment().format();
        let dateCheck = timeCurrentcheck[timeCurrentcheck.length - 14];
        if (dateCheck === "0") {
          dateCheck = Number(timeCurrentcheck[timeCurrentcheck.length - 13]);
        } else {
          dateCheck = Number(
            timeCurrentcheck[timeCurrentcheck.length - 14] +
              timeCurrentcheck[timeCurrentcheck.length - 13]
          );
        }
        //dateCheck = dateCheck + 8

        if (dateCheck > 16) {
          columns = columns + 1;
        }
        //---------------------------
        //Получаем значение текущей даты
        dataColumn = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${listSheet[0]}!R3C${columns}:R3C${columns + 30}`,
        });
        dateList = dataColumn.data.values.flat();
        dateListButton = anotherMaster.concat(dateList);
        currentDay = dateList[0];
        chose.telegram.sendMessage(
          chose.chat.id,
          "Клиент выбрал мастера: " +
            `${indexMaster}` +
            "\n" +
            "Уточните, на какую дату его записать",
          Markup.keyboard(dateListButton).oneTime().resize()
        );
      } else if (anotherDate.includes(checkMessage)) {
        // Определяем текущую дату из строки 2 с датами
        dataSheets = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${listSheet[0]}!2:2`,
        });
        dateArr = dataSheets.data.values.flat();
        let columns = 1;
        for (let i = 0; i < dateArr.length; i++) {
          if (
            new Date().getMonth() + 1 + "/" + new Date().getDate() ===
            dateArr[i]
          ) {
            columns = columns + i;
            break;
          }
        }
        // ---------------------------
        let timeCurrentcheck = moment().format();
        let dateCheck = timeCurrentcheck[timeCurrentcheck.length - 14];
        if (dateCheck === "0") {
          dateCheck = Number(timeCurrentcheck[timeCurrentcheck.length - 13]);
        } else {
          dateCheck = Number(
            timeCurrentcheck[timeCurrentcheck.length - 14] +
              timeCurrentcheck[timeCurrentcheck.length - 13]
          );
        }
        //dateCheck = dateCheck + 8

        if (dateCheck > 16) {
          columns = columns + 1;
        }
        //---------------------------
        //Получаем значение текущей даты
        dataColumn = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${listSheet[0]}!R3C${columns}:R3C${columns + 30}`,
        });
        dateList = dataColumn.data.values.flat();
        dateListButton = anotherMaster.concat(dateList);
        currentDay = dateList[0];
        chose.telegram.sendMessage(
          chose.chat.id,
          "Клиент выбрал мастера: " +
            `${indexMaster}` +
            "\n" +
            "Подбирите для него другую подходящую дату",
          Markup.keyboard(dateListButton).oneTime().resize()
        );
      } else if (currentDay.includes(checkMessage)) {
        console.log("Я в текущей дате");
        indexDate = chose.update.message.text;
        let numberRecordsArr = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${listSheet[0]}!A4:A`,
        });
        numberRecords = numberRecordsArr.data.values.length;
        let dateSheetsArr = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${listSheet[0]}!3:3`,
        });
        dateSheets = dateSheetsArr.data.values.flat();
        timeArray = numberRecordsArr.data.values.flat();
        let timeCurrent = moment().format();
        let dateCheck = timeCurrent[timeCurrent.length - 14];
        if (dateCheck === "0") {
          dateCheck = Number(timeCurrent[timeCurrent.length - 13]);
        } else {
          dateCheck = Number(
            timeCurrent[timeCurrent.length - 14] +
              timeCurrent[timeCurrent.length - 13]
          );
        }
        dateCheck = dateCheck + 8;
        let timeSheets = numberRecordsArr.data.values.flat();
        let time = "";
        let row = 0;
        for (i = 0; i < timeSheets.length; i++) {
          if (timeSheets[i][0] === "1") {
            time = timeSheets[i][0] + timeSheets[i][1];
            // console.log(Number(time));
            row = row + 1;
          } else {
            time = timeSheets[i][0];
            // console.log(Number(time));
            row = row + 1;
          }

          if (Number(time) === dateCheck) {
            // console.log(row);
            break;
          }
        }
        console.log(row);
        let column = 1;
        for (let i = 0; i < dateArr.length; i++) {
          if (indexDate === dateSheets[i]) {
            column = column + i;
            break;
          }
        }
        // Определили колонку с выбранной датой
        indexColumn = column;
        //console.log(column);
        let timeColumn = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${indexMaster}!R4C${column}:R${numberRecords + 4}C${column}`,
        });
        //console.log(timeColumn);
        //Определяем свободное время
        let timeArr = [];
        for (i = row + 2; i < numberRecords + 4; i++) {
          if (timeColumn.data.values[i] == "") {
            let itemss = timeArray[i];
            timeArr = timeArr.concat(itemss);
          }
        }
        //Добавлем к массиву времени возврат к дате
        let items = timeArr;
        let itemsDop = ["Выбрать другую дату"];
        Array.prototype.push.apply(items, itemsDop);
        //let dateList = dataColumn.data.values.flat();
        chose.telegram.sendMessage(
          chose.chat.id,
          "Клиент выбрал дату: " +
            `${indexDate}` +
            "\nУточните, на какое время его записать",
          Markup.keyboard(items).oneTime().resize()
        );
        //});
      } else if (dateList.includes(checkMessage)) {
        console.log("Я тут");
        indexDate = chose.update.message.text;
        let numberRecordsArr = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${listSheet[0]}!A4:A`,
        });
        numberRecords = numberRecordsArr.data.values.length;
        let dateSheetsArr = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${listSheet[0]}!3:3`,
        });
        dateSheets = dateSheetsArr.data.values.flat();
        timeArray = numberRecordsArr.data.values.flat();
        let column = 1;
        for (let i = 0; i < dateArr.length; i++) {
          if (indexDate === dateSheets[i]) {
            column = column + i;
            break;
          }
        }

        // Определили колонку с выбранной датой
        indexColumn = column;
        console.log(column);
        let timeColumn = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${indexMaster}!R4C${column}:R${numberRecords + 4}C${column}`,
        });

        //Определяем свободное время
        let timeArr = [];
        for (i = 0; i < numberRecords + 4; i++) {
          if (timeColumn.data.values[i] == "") {
            let itemss = timeArray[i];
            timeArr = timeArr.concat(itemss);
          }
        }
        //Добавлем к массиву времени возврат к дате
        let items = timeArr;
        let itemsDop = ["Выбрать другую дату"];
        Array.prototype.push.apply(items, itemsDop);
        //let dateList = dataColumn.data.values.flat();
        chose.telegram.sendMessage(
          chose.chat.id,
          "Клиент выбрал дату: " +
            `${indexDate}` +
            ". \nУточните, на какое время его записать",
          Markup.keyboard(items).oneTime().resize()
        );
        //});
      } else if (anotherTime.includes(checkMessage)) {
        console.log("Я тут другое время");
        //indexDate = chose.update.message.text;
        let numberRecordsArr = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${listSheet[0]}!A4:A`,
        });
        numberRecords = numberRecordsArr.data.values.length;
        let dateSheetsArr = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${listSheet[0]}!3:3`,
        });
        dateSheets = dateSheetsArr.data.values.flat();
        timeArray = numberRecordsArr.data.values.flat();
        let column = 1;
        for (let i = 0; i < dateArr.length; i++) {
          if (indexDate === dateSheets[i]) {
            column = column + i;
            break;
          }
        }
        // Определили колонку с выбранной датой
        //console.log(column);
        indexColumn = column;

        let timeColumn = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${indexMaster}!R4C${column}:R${numberRecords + 4}C${column}`,
        });

        //Определяем свободное время
        let timeArr = [];
        for (i = 0; i < numberRecords + 4; i++) {
          if (timeColumn.data.values[i] == "") {
            let itemss = timeArray[i];
            timeArr = timeArr.concat(itemss);
          }
        }
        //Добавлем к массиву времени возврат к дате
        let items = timeArr;
        let itemsDop = ["Выбрать другую дату"];
        Array.prototype.push.apply(items, itemsDop);
        //let dateList = dataColumn.data.values.flat();
        chose.telegram.sendMessage(
          chose.chat.id,
          "Клиент выбрал дату: " +
            `${indexDate}` +
            ". \nНайдите для него другое свободное время.",
          Markup.keyboard(items).oneTime().resize()
        );
        //});
      } else if (timeArray.includes(checkMessage)) {
        indexTime = chose.update.message.text;

        let rowTime = 4;
        for (i = 0; i < timeArray.length; i++) {
          if (indexTime == timeArray[i]) {
            rowTime = rowTime + i;
            indexRow = rowTime;
            break;
          }
        }
        //  let pointNameClient = ["Укажите имя клиента"];
        chose.telegram.sendMessage(
          chose.chat.id,
          "Клиент выбрал: \nМастер: " +
            `${indexMaster}` +
            "\nУслуга: " +
            `${indexService}` +
            "\nДата записи: " +
            `${indexDate}` +
            "\nВремя записи: " +
            `${indexTime}` +
            '\n(Уточняем  клиента данные и нажимаем на кнопку "Указать имя клиента". Имя вводить только после нажатия на кнопку )',
          Markup.keyboard(pointNameClient).oneTime().resize()
        );
        return chose.scene.leave();
      } else if (confirmRecordAdmin.includes(checkMessage)) {
        let listSetting = new Array();
        for (i = 0; i < 2; i++) {
          listSetting.push(metaData.data.sheets[i].properties.title);
        }
        // Проверка свободно время или нет
        let checkFreeArr = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${indexMaster}!R${indexRow}C${indexColumn}:R${indexRow}C${indexColumn}`,
        });
        let checkFree = checkFreeArr.data.values;
        if (checkFree === undefined) {
          let dateRecord = {
            values: [
              "Клиент: " + `${nameClient}` + "\nУслуга: " + `${indexService}`,
            ],
          };
          const updateOptions = {
            spreadsheetId: idSheets,
            range: `${indexMaster}!R${indexRow}C${indexColumn}:R${indexRow}C${indexColumn}`,
            valueInputOption: "USER_ENTERED",
            resource: { values: dateRecord },
          };
          await gsapi.spreadsheets.values.update(updateOptions);

          //Оповещение администраторов
          adminChatIdArr = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSetting[0]}!E1:E`,
          });
          let adminMessage = adminChatIdArr.data.values.flat();
          for (let m = 1; m < adminMessage.length; m++) {
            chose.telegram.sendMessage(
              adminMessage[m],
              "Появилась новая запись:\nМастер: " +
                `${indexMaster}` +
                "\nКлиент: " +
                `${nameClient}` +
                "\nУслуга: " +
                `${indexService}` +
                "\nДата записи: " +
                `${indexDate}` +
                "\nВремя записи: " +
                `${indexTime}`,
              // "\nТелефон: " +
              // `${indexPhone}` +
              // "\nID: " +
              // `${chose.chat.id}`,
              Markup.keyboard(adminMenu).oneTime().resize()
            );
          }
          //Оповещение мастера
          let masterNameArr = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSetting[0]}!G1:G`,
          });
          let masterName = masterNameArr.data.values.flat();
          for (let m = 1; m < masterName.length; m++) {
            if (`${masterName[m]}` == `${indexMaster}`) {
              let masterIdArr = await gsapi.spreadsheets.values.get({
                spreadsheetId: idSheets,
                range: `${listSetting[0]}!F1:F`,
              });
              let masterId = masterIdArr.data.values.flat()[m];
              chose.telegram.sendMessage(
                masterId,
                "Появилась новая запись: " +
                  "\nКлиент: " +
                  `${nameClient}` +
                  "\nУслуга: " +
                  `${indexService}` +
                  "\nДата записи: " +
                  `${indexDate}` +
                  "\nВремя записи: " +
                  `${indexTime}`
              );
              break;
            }
          }
          return chose.scene.leave();
        } else {
          chose.telegram.sendMessage(
            chose.chat.id,
            "К сожалению это время уже забронировали. Вы выбрали дату: " +
              `${indexDate}` +
              ". \nВыберите другое свободное время",
            Markup.keyboard(anotherTime).oneTime().resize()
          );
        }
      } else {
        chose.telegram.sendMessage(
          chose.chat.id,
          'Неизвестная команда. Сделайте выбор по кнопкам, либо напишите слово "старт" или "запись". Пишем без кавычек'
        );
        return;
      }
      // });
    });
    //  запись имени клиента
    nameClientSce.enter(async (chose) => {
      await chose.reply("Введите имя клиента и отправьте сообщением");
      nameClientSce.on("message", (chose) => {
        let checkName = chose.message.text;
        let checkAnswer = /^[а-яА-ЯёЁa-zA-Z0-9]+$/;
        console.log(checkName);

        if (checkAnswer.test(checkName)) {
          nameClient = chose.message.text;
          let buttonTime = ["Подтвердить запись клиента"];
          chose.reply(
            "Подтвердите запись клиента",
            Markup.keyboard(buttonTime).oneTime().resize()
          );
          return chose.scene.leave();
        } else {
          chose.telegram.sendMessage(chose.chat.id, "Введите корректное имя");
        }
      });
    });
    //--------------------------------- здесь заканчивается запись клента админом

    //  Удаление записи клиентом
    removeChoice.enter(async (chose) => {
      let removeConfirmChoice = ["Да, удалить", "Запись не удалять"];
      // let removeConfirm = ["Да, удалить"];
      // let noremoveConfirm = ["Запись не удалять"];
      chose.telegram.sendMessage(
        chose.chat.id,
        'Для удаления записи нажмите на кнопку "Да, удалить". Если вы нажали ошибочно, нажмите "Запись не удалять"',
        Markup.keyboard(removeConfirmChoice).oneTime().resize()
      );
    });
    removeChoice.on("message", async (chose) => {
      let answer = chose.update.message.text;
      let removeConfirm = ["Да, удалить"];
      let noremoveConfirm = ["Запись не удалять"];
      if (removeConfirm.includes(answer)) {
        let clientBaseIdAr = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${listSetting[0]}!A1:A`,
        });
        let clientBaseId = clientBaseIdAr.data.values.flat();
        for (let n = 0; n < clientBaseId.length; n++) {
          if (`${clientBaseId[n]}` == `${chose.chat.id}`) {
            let clientLastRecords = await gsapi.spreadsheets.values.get({
              spreadsheetId: idSheets,
              range: `${listSetting[0]}!H${n + 1}:N${n + 1}`,
            });
            let nameClient = clientLastRecords.data.values.flat()[0];
            let indexMaster = clientLastRecords.data.values.flat()[3];
            let indexService = clientLastRecords.data.values.flat()[4];
            let indexDate = clientLastRecords.data.values.flat()[1];
            let indexTime = clientLastRecords.data.values.flat()[2];
            let indexRow = clientLastRecords.data.values.flat()[5];
            let indexColumn = clientLastRecords.data.values.flat()[6];
            let deleteValuesWork = { values: ["", "", "", "", "", "", ""] };
            const updateOptions1 = {
              spreadsheetId: idSheets,
              range: `${listSetting[0]}!R${n + 1}C8:R${n + 1}C14`,
              valueInputOption: "USER_ENTERED",
              resource: { values: deleteValuesWork },
            };
            await gsapi.spreadsheets.values.update(updateOptions1);
            //break;
            // }
            //  }
            const updateOptionsDelete = {
              spreadsheetId: idSheets,
              range: `${indexMaster}!R${indexRow}C${indexColumn}:R${indexRow}C${indexColumn}`,
              valueInputOption: "USER_ENTERED",
              resource: { values: deleteValues },
            };
            await gsapi.spreadsheets.values.update(updateOptionsDelete);

            chose.telegram.sendMessage(
              chose.chat.id,
              'Мы удалили вашу запись. Вы можете записаться на другую дату. Для этого нажмите на кнопку "Новая запись" или напишите слово "запись" (пишем без кавычек).',
              Markup.keyboard(recordNewButton).oneTime().resize()
            );

            adminChatIdArr = await gsapi.spreadsheets.values.get({
              spreadsheetId: idSheets,
              range: `${listSetting[0]}!E1:E`,
            });
            let adminMessage = adminChatIdArr.data.values.flat();
            for (let m = 1; m < adminMessage.length; m++) {
              chose.telegram.sendMessage(
                adminMessage[m],
                "Была удалена следующая запись:\nМастер: " +
                  `${indexMaster}` +
                  "\nКлиент: " +
                  `${nameClient}` +
                  "\nУслуга: " +
                  `${indexService}` +
                  "\nДата записи: " +
                  `${indexDate}` +
                  "\nВремя записи:" +
                  `${indexTime}`
              );
            }
            //Оповещение мастера
            let masterNameArr = await gsapi.spreadsheets.values.get({
              spreadsheetId: idSheets,
              range: `${listSetting[0]}!G1:G`,
            });
            masterName = masterNameArr.data.values.flat();
            for (let m = 1; m < masterName.length; m++) {
              if (`${masterName[m]}` == `${indexMaster}`) {
                masterIdArr = await gsapi.spreadsheets.values.get({
                  spreadsheetId: idSheets,
                  range: `${listSetting[0]}!F1:F`,
                });
                masterId = masterIdArr.data.values.flat()[m];
                chose.telegram.sendMessage(
                  masterId,
                  "Была удалена следующая запись: " +
                    "\nКлиент: " +
                    `${nameClient}` +
                    "\nУслуга: " +
                    `${indexService}` +
                    "\nДата записи: " +
                    `${indexDate}` +
                    "\nВремя записи:" +
                    `${indexTime}`
                );
                break;
              }
            }
            break;
          }
        }
        return chose.scene.leave();
      } else if (noremoveConfirm.includes(answer)) {
        chose.telegram.sendMessage(
          chose.chat.id,
          "Отлично ваша запись сохранена",
          Markup.keyboard(deleteRecord).oneTime().resize()
        );
        return chose.scene.leave();
      }
    });
  } catch (e) {
    console.error(e);
  }
}
