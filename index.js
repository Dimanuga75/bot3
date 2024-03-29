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
const worker = new Scenes.BaseScene("work");
const stage = new Stage([
  startScene,
  black,
  removeChoice,
  recordClient,
  nameClientSce,
  removeChoiceAdmin,
  worker,
]);

bot.use(Telegraf.log());
let adminMenu = [
  "Записать клиента",
  "Удалить запись клиента",
  "Работа с таблицей",
];
bot.use(session());
bot.use(stage.middleware());
bot.hears("/start", Stage.enter("startScene"));
bot.hears("/777", Stage.enter("black"));
bot.hears("Удалить запись", Stage.enter("removeChoice"));
bot.hears("запись", Stage.enter("recordClient"));
bot.hears("старт", Stage.enter("recordClient"));
bot.hears("1", Stage.enter("recordClient"));
bot.hears("/run", Stage.enter("recordClient"));
bot.hears("Указать имя клиента", Stage.enter("nameClientSce"));
bot.hears("Новая запись", Stage.enter("recordClient"));
bot.hears("Работа с таблицей", Stage.enter("work"));

//bot.hears("Вернуться в начало", Stage.enter("recordClient"));
bot.hears("/555", (ctx) =>
  ctx.reply(
    "Выбирайте по кнопкам",
    Markup.keyboard(adminMenu).oneTime().resize()
  )
);
bot.hears("Вернуться в начальное меню", (ctx) =>
  ctx.reply(
    "Выбирайте по кнопкам",
    Markup.keyboard(adminMenu).oneTime().resize()
  )
);
bot.hears("Удалить запись клиента", Stage.enter("removeChoiceAdmin"));
bot.hears("Выбрать еще мастера", Stage.enter("work"));

//bot.help((ctx) => ctx.reply("Send me a sticker"));
//bot.on("sticker", (ctx) => ctx.reply("👍"));
//bot.hears("hi", (ctx) => ctx.reply("Heloooooo"));
bot.launch();
let timeZone = 8;
// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

const { google } = require("googleapis");
const { chat } = require("googleapis/build/src/apis/chat");
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

client.authorize(function (err, tokens) {
  if (err) {
    console.log(err);
    return;
  } else {
    console.log("Connected");
    gsrun(client);
  }
});
let timeCurrent1 = moment().format();

console.log(timeCurrent1);

async function gsrun(cl) {
  try {
    const gsapi = google.sheets({ version: "v4", auth: cl });
    metaData = await gsapi.spreadsheets.get({
      spreadsheetId: idSheets,
    });
    let listId = new Array();
    for (i = 2; i < metaData.data.sheets.length; i++) {
      listId.push(metaData.data.sheets[i].properties.sheetId);
    }

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
        `${listSetting[0]}!A2:A`,
        `${listSetting[0]}!H2:H`,
        `${listSetting[0]}!I2:I`,
        `${listSetting[0]}!J2:J`,
        `${listSetting[0]}!K2:k`,
        `${listSetting[0]}!L2:L`,
        `${listSetting[0]}!E2:E`,
        `${listSetting[0]}!F2:F`,
        `${listSetting[0]}!G2:G`,
        `${listSetting[0]}!D2:D`,
      ],
    });

    // let serviceList = dataBase.data.valueRanges[0].values.flat();
    let numberRecords = dataBase.data.valueRanges[1].values.length;
    let timeArray = dataBase.data.valueRanges[1].values.flat();
    let dateSheets = dataBase.data.valueRanges[2].values.flat();
    let dateArr = dataBase.data.valueRanges[3].values.flat();
    // let priceList = dataBase.data.valueRanges[4].values.flat();
    let clientBaseIdAr = dataBase.data.valueRanges[5].values.flat();
    let idTimeInterval = Array(clientBaseIdAr.length);

    let clientNameArr = dataBase.data.valueRanges[14].values.flat();
    let clientDataArr = dataBase.data.valueRanges[11].values.flat();
    let clientTimeArr = dataBase.data.valueRanges[12].values.flat();
    let clientMasterArr = dataBase.data.valueRanges[13].values.flat();
    let clientServiceArr = dataBase.data.valueRanges[6].values.flat();
    let monthRec = dataBase.data.valueRanges[7].values.flat();
    let dataRec = dataBase.data.valueRanges[8].values.flat();
    let hoursRec = dataBase.data.valueRanges[9].values.flat();
    let minuteRec = dataBase.data.valueRanges[10].values.flat();

    let currentYear = new Date().getFullYear();
    let currentDateRestart = Date.now();
    let deleteRecord = ["Новая запись", "Удалить запись"];

    let mmsHours = 3600000;

    for (i = 0; i < clientBaseIdAr.length; i++) {
      dateRecords = new Date(
        currentYear,
        monthRec[i],
        dataRec[i],
        hoursRec[i],
        minuteRec[i]
      );
      let intervalTime =
        dateRecords - currentDateRestart - mmsHours * (timeZone + 1);

      if (intervalTime > 0) {
        console.log(intervalTime);

        let chatid = clientBaseIdAr[i];
        let clientName = clientNameArr[i];
        let indexDate = clientDataArr[i];
        let indexTime = clientTimeArr[i];
        let indexService = clientServiceArr[i];
        let indexMaster = clientMasterArr[i];
        console.log(chatid);
        async function Setinterval() {
          bot.telegram.sendMessage(
            chatid,

            "Приветсвуем вас " +
              `${clientName}` +
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
        const timerId = setTimeout(Setinterval, intervalTime);

        idTimeInterval[i] = Number(timerId);
      }
    }

    //-----------------------------------------------------------------!!!!!!!!!!!!

    //  Получаем прай-лист
    // let textPrice = "";
    // for (i = 0; i < serviceList.length; i++) {
    //   textPrice = textPrice + `${serviceList[i]} - ` + `${priceList[i]}` + "\n";
    // }
    //------------------------------------------------------------/////////
    // Определяем текущую дату из строки 2 с датами
    //Получаем номер колонки с текущей датой
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
    dateCheck = dateCheck + timeZone;
    if (dateCheck >= 19) {
      columns = columns + 1;
    }
    // ------------------------------------

    let dateAfterCurrentDate = dateArr.length - columns;

    //---------------------------
    //Получаем значение текущей даты
    let dataColumn = await gsapi.spreadsheets.values.get({
      spreadsheetId: idSheets,
      range: `${listSheet[0]}!R3C${columns}:R3C${
        columns + dateAfterCurrentDate
      }`,
    });
    let dateList = dataColumn.data.values.flat();
    let currentDay = dateList[0];

    let startBot = [
      "старт",
      "запись",
      "Вернуться в начало",
      "1",
      "/run",
      "/start",
    ];
    let anotherMaster = ["Выбрать другого мастера"];
    let confirmEntry = ["Подтвердить запись ✅"];
    let anotherService = ["Выбрать другую услугу"];
    let anotherDate = ["Выбрать другую дату"];
    let anotherDateMaster = ["Выбрать новую дату"];
    let anotherTime = ["Выбрать другое время ☝️"];
    let priceButton = ["Прайс лист"];
    let serviceChoice = ["Выбрать услугу", "Выбрать другую услугу"];
    let serviceButton = ["Выбрать услугу"];
    let pointNameClient = ["Указать имя клиента", "Выбрать другое время ☝️"];
    let clientRecord = ["Записать клиента"];
    let confirmRecordAdmin = ["Подтвердить запись клиента"];
    let recordNewButton = ["Новая запись"];
    // let listSheet = new Array();
    let deleteValues = {
      values: [""],
    };
    let dateListButton;
    let listSheetButton = listSheet.concat(anotherService);
    let timerId;
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
      //let timeArray = dataBase.data.valueRanges[1].values.flat();
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
          dateCheck = dateCheck + timeZone;
          if (dateCheck >= 19) {
            columns = columns + 1;
          }
          let dateAfterCurrentDate = dateArr.length - columns;
          //---------------------------
          //Получаем значение текущей даты
          let dataColumn = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${indexMaster}!R3C${columns}:R3C${
              columns + dateAfterCurrentDate
            }`,
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
          chose.telegram.sendMessage(
            chose.chat.id,
            "Выбран мастер: " +
              `${indexMaster}` +
              "\n" +
              "Выберите дату, на которую была сделана запись",
            Markup.keyboard(dateListButton).oneTime().resize()
          );
        } else if (checkMessage == currentDay) {
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
          timeCheck = timeCheck + timeZone;
          if (timeCheck >= 19) {
            timeCheck = 8;
          }
          let timeMasterArray = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: [`${indexMaster}!A4:A`],
          });
          timeMaster = timeMasterArray.data.values.flat();

          let time = "";
          let row = 0;
          for (i = 0; i < timeMaster.length; i++) {
            if (timeMaster[i][0] === "1") {
              time = timeMaster[i][0] + timeMaster[i][1];
              row = row + 1;
            } else {
              time = timeMaster[i][0];
              row = row + 1;
            }
            if (Number(timeCheck) <= 7) {
              row = 0;
              break;
            } else if (Number(time) === Number(timeCheck)) {
              break;
            }
          }

          let column = 1;
          for (let i = 0; i < dateSheets.length; i++) {
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
          for (i = row; i < numberRecords; i++) {
            if (timeColumn.data.values[i] == "") {
            } else {
              let itemss = timeMaster[i];
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
          let timeMasterArray = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: [`${indexMaster}!A4:A`],
          });
          timeMaster = timeMasterArray.data.values.flat();
          let column = 1;
          for (let i = 0; i < dateSheets.length; i++) {
            if (indexDate === dateSheets[i]) {
              column = column + i;
              break;
            }
          }

          // Определили колонку с выбранной датой
          indexColumn = column;
          // console.log(column);
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
              let itemss = timeMaster[i];
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
        } else if (timeMaster.includes(checkMessage)) {
          indexTime = chose.update.message.text;
          //Определяем строку записи по выбранному времени из всего массива времени
          let rowTime = 4;
          for (i = 0; i < timeMaster.length; i++) {
            if (indexTime == timeMaster[i]) {
              rowTime = rowTime + i;
              indexRow = rowTime;
              break;
            }
          }
          let buttonTime = [
            "Удалить выбранную запись",
            "Выбрать другое время ☝️",
          ];

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
      text = ctx.message.text;
      //console.log(text);
      nameClient = ctx.chat.first_name;
      idClient = ctx.chat.id.toString();
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
        ranges: [`${listSetting[0]}!D1:D`, `${listSetting[0]}!A1:A`],
      });
      // Формируем черный список
      let blackList = dataBaseStart.data.valueRanges[0].values.flat();
      numberClient = dataBaseStart.data.valueRanges[1].values.length;

      if (blackList.includes(check)) {
        return ctx.scene.leave();
      }
      let dateRecord = {
        values: [
          `${idClient}`,
          `${nameClient}`,
          "0",
          "0",
          "0",
          "0",
          "0",
          "0",
          "0",
          "0",
          "0",
          "0",
        ],
      };
      if (dataBaseStart.data.valueRanges[1].values.flat().includes(idClient)) {
        ctx.reply(
          "Приветствуем вас " +
            `${nameClient}` +
            '.🙏 \nДля записи на услугу нажмите на кнопку "Новая запись" или напишите сообщение "запись" (пишем без кавычек). \nЕсли бот перестанет отвечать, слево есть голубенькое меню. Нажмите на него и выполните команду экстренного запуска бота',
          Markup.keyboard(recordNewButton).oneTime().resize()
        );
        return ctx.scene.leave();
      } else {
        const updateOptions = {
          spreadsheetId: idSheets,
          range: `${listSetting[0]}!R${numberClient + 1}C1:R${
            numberClient + 1
          }C16`,
          valueInputOption: "USER_ENTERED",
          resource: { values: dateRecord },
        };
        await gsapi.spreadsheets.values.update(updateOptions);
        //if (
        //  dataBaseStart.data.valueRanges[1].values.flat().includes(`${idClient}`)
        //) {
        ctx.reply(
          "Приветствуем вас " +
            `${nameClient}` +
            '.🙏 \nДля записи на услугу нажмите на кнопку "Новая запись" или напишите сообщение "запись" (пишем без кавычек).\nЕсли бот перестанет отвечать, слево есть голубенькое меню. Нажмите на него и выполните команду экстренного запуска бота',
          Markup.keyboard(recordNewButton).oneTime().resize()
        );
        return ctx.scene.leave();
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
      metaData = await gsapi.spreadsheets.get({
        spreadsheetId: idSheets,
      });
      let listId = new Array();
      for (i = 2; i < metaData.data.sheets.length; i++) {
        listId.push(metaData.data.sheets[i].properties.sheetId);
      }

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
          `${listSetting[0]}!A2:A`,
          `${listSetting[0]}!H2:H`,
          `${listSetting[0]}!I2:I`,
          `${listSetting[0]}!J2:J`,
          `${listSetting[0]}!K2:k`,
          `${listSetting[0]}!L2:L`,
          `${listSetting[0]}!P1:P`,
          `${listSetting[0]}!F2:F`,
          `${listSetting[0]}!G2:G`,
          `${listSetting[0]}!D2:D`,
        ],
      });

      serviceList = dataBase.data.valueRanges[0].values.flat();
      // let numberRecords = dataBase.data.valueRanges[1].values.length;
      // let timeArray = dataBase.data.valueRanges[1].values.flat();
      // let dateSheets = dataBase.data.valueRanges[2].values.flat();
      // let dateArr = dataBase.data.valueRanges[3].values.flat();
      priceList = dataBase.data.valueRanges[4].values.flat();
      clientBaseIdAr = dataBase.data.valueRanges[5].values.flat();
      //idTimeInterval = Array(clientBaseIdAr.length);

      // let clientNameArr = dataBase.data.valueRanges[14].values.flat();

      // let clientTimeArr = dataBase.data.valueRanges[12].values.flat();
      // let clientMasterArr = dataBase.data.valueRanges[13].values.flat();
      // let clientServiceArr = dataBase.data.valueRanges[6].values.flat();
      let monthRec = dataBase.data.valueRanges[7].values.flat();
      let dataRec = dataBase.data.valueRanges[8].values.flat();
      let hoursRec = dataBase.data.valueRanges[9].values.flat();
      let minuteRec = dataBase.data.valueRanges[10].values.flat();
      blackList = dataBase.data.valueRanges[11].values.flat();

      chose.reply("...");
      let currentDateCheck = Date.now();
      let intervalRecords;
      let clientRecord;
      for (i = 0; i < clientBaseIdAr.length; i++) {
        if (check == clientBaseIdAr[i]) {
          dateRecords = new Date(
            currentYear,
            monthRec[i],
            dataRec[i],
            hoursRec[i],
            minuteRec[i]
          );
          intervalRecords =
            dateRecords - currentDateCheck - mmsHours * timeZone;
          // console.log(intervalRecords);
          clientRecord = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSetting[0]}!E${i + 2}:H${i + 2}`,
          });
          break;
        }
      }
      if (intervalRecords > 0) {
        chose.reply(
          "У вас есть действующая запись 💁‍♂️:\nМастер: " +
            `${clientRecord.data.values.flat()[2]}` +
            "\nУслуга ✂️: " +
            `${clientRecord.data.values.flat()[3]}` +
            "\nДата записи 🗓: " +
            `${clientRecord.data.values.flat()[0]}` +
            "\nВремя записи ⏰: " +
            `${clientRecord.data.values.flat()[1]}` +
            "\nЕсли вы хотите изменить время посещения, необходимо сначала удалить текущую запись",
          Markup.keyboard(deleteRecord).oneTime().resize()
        );
        return chose.scene.leave();
      } else {
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
        dateCheck = dateCheck + timeZone;
        if (dateCheck >= 20) {
          columns = columns + 1;
        }
        //Получаем значение текущей даты
        dataColumn = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${listSheet[0]}!R3C${columns}:R3C${dateArr.length}`,
        });
        dateList = dataColumn.data.values.flat();
        dateListButton = anotherMaster.concat(dateList);
        currentDay = dateList[0];

        if (blackList.includes(check)) {
          return chose.scene.leave();
        } else if (recordNewButton.includes(checkMessage)) {
          // Array.prototype.push.apply(serviceList, priceButton);

          chose.telegram.sendMessage(
            chose.chat.id,
            "Выберите на какую услугу вас записать 👇",
            Markup.keyboard(serviceList).oneTime().resize()
          );
        } else if (startBot.includes(checkMessage)) {
          // Array.prototype.push.apply(serviceList, priceButton);
          chose.telegram.sendMessage(
            chose.chat.id,
            "Приветствуем вас " +
              `${nameClient}` +
              ".\nВыберите на какую услугу вас записать 👇",
            Markup.keyboard(serviceList).oneTime().resize()
          );
        }
      }
      recordClient.on("message", async (chose) => {
        try {
          checkMessage = chose.message.text.toString();

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
              `${listSetting[0]}!P1:P`,
            ],
          });
          // Проверяем на черный список
          let serviceList = dataBase.data.valueRanges[0].values.flat();
          let numberRecords = dataBase.data.valueRanges[1].values.length;
          //  let timeArray = dataBase.data.valueRanges[1].values.flat();
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
          } else if (startBot.includes(checkMessage)) {
            // Array.prototype.push.apply(serviceList, priceButton);
            chose.telegram.sendMessage(
              chose.chat.id,
              "Приветствуем вас " +
                `${nameClient}` +
                ".\nВыберите на какую услугу вас записать 👇 \n(Если бот перестанет отвечать, слево есть голубенькое меню. Нажмите на него и выполните команду экстренного запуска бота)",
              Markup.keyboard(serviceList).oneTime().resize()
            );
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
              "Выберите на какую услугу вас записать 👇",
              Markup.keyboard(serviceList).oneTime().resize()
            );
          } else if (serviceList.includes(checkMessage)) {
            indexService = chose.update.message.text;
            chose.telegram.sendMessage(
              chose.chat.id,
              "К какому мастеру вас записать 💁‍♂️",
              Markup.keyboard(listSheetButton).oneTime().resize()
            );
          } else if (anotherMaster.includes(checkMessage)) {
            chose.telegram.sendMessage(
              chose.chat.id,
              "Выберите другого мастера 💁‍♀️",
              Markup.keyboard(listSheetButton).oneTime().resize()
            );
          } else if (listSheet.includes(checkMessage)) {
            indexMaster = chose.update.message.text;
            chose.telegram.sendMessage(
              chose.chat.id,
              "Вы выбрали мастера: " +
                `${indexMaster}` +
                "\n" +
                "Проверяю наличие свободных дат для записи ..."
            );
            // Определяем текущую дату из строки 2 с датами
            dataSheets = await gsapi.spreadsheets.values.get({
              spreadsheetId: idSheets,
              range: `${indexMaster}!2:2`,
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
              dateCheck = Number(
                timeCurrentcheck[timeCurrentcheck.length - 13]
              );
            } else {
              dateCheck = Number(
                timeCurrentcheck[timeCurrentcheck.length - 14] +
                  timeCurrentcheck[timeCurrentcheck.length - 13]
              );
            }
            dateCheck = dateCheck + timeZone;
            if (dateCheck >= 20) {
              columns = columns + 1;
            }

            //Получаем значение текущей даты
            // Ищем свободные даты
            let dateFree = [];
            let dataColumn = await gsapi.spreadsheets.values.get({
              spreadsheetId: idSheets,
              range: `${indexMaster}!R3C${columns}:R26C${dateArr.length}`,
            });
            let dateList = dataColumn.data.values;
            for (i = 0; i <= dateArr.length - columns; i++) {
              for (b = 1; b < 24; b++) {
                if (dateList[b][i] == "") {
                  dateFree = dateFree.concat(dateList[0][i]);
                  break;
                }
              }
            }
            dateListButton = anotherMaster.concat(dateFree);
            currentDay = dateList[0][0];

            chose.telegram.sendMessage(
              chose.chat.id,
              "🗓Свободные дни. На какую дату вас записать?",
              Markup.keyboard(dateListButton).oneTime().resize()
            );
          } else if (anotherDate.includes(checkMessage)) {
            chose.telegram.sendMessage(
              chose.chat.id,
              "Вы выбрали мастера: " +
                `${indexMaster}` +
                "\n" +
                "Посмотрите другую дату 📆:",
              Markup.keyboard(dateListButton).oneTime().resize()
            );
          } else if (checkMessage == currentDay) {
            indexDate = chose.update.message.text;
            let timeCurrent = moment().format();
            console.log(moment().format());
            let timeCheck = timeCurrent[timeCurrent.length - 14];
            if (timeCheck === "0") {
              timeCheck = Number(timeCurrent[timeCurrent.length - 13]);
            } else {
              timeCheck = Number(
                timeCurrent[timeCurrent.length - 14] +
                  timeCurrent[timeCurrent.length - 13]
              );
            }
            timeCheck = timeCheck + timeZone;
            if (timeCheck >= 20) {
              timeCheck = 8;
            }
            let dataBaseSheet = await gsapi.spreadsheets.values.batchGet({
              spreadsheetId: idSheets,
              ranges: [`${indexMaster}!A4:A`, `${indexMaster}!3:3`],
            });
            dateSheets = dataBaseSheet.data.valueRanges[1].values.flat();
            numberRecords = dataBaseSheet.data.valueRanges[0].values.length;
            timeMaster = dataBaseSheet.data.valueRanges[0].values.flat();

            let time = "";
            let row = 0;
            for (i = 0; i < timeMaster.length; i++) {
              if (timeMaster[i][0] === "1") {
                time = timeMaster[i][0] + timeMaster[i][1];
                //  console.log(Number(time));
                row = row + 1;
              } else {
                time = timeMaster[i][0];
                //  console.log(Number(time));
                row = row + 1;
              }
              if (Number(timeCheck) <= 7) {
                row = 0;
                break;
              } else if (Number(time) === Number(timeCheck)) {
                //  console.log(row);
                break;
              }
            }
            // console.log(row);
            // console.log(Number(timeCheck));
            // Определим колонку с текущей датой
            let column = 1;
            for (let i = 0; i < dateSheets.length; i++) {
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

            //Определяем свободное время
            let timeArr = [];
            for (i = row + 1; i < numberRecords + 4; i++) {
              if (timeColumn.data.values[i] == "") {
                let itemss = timeMaster[i];
                timeArr = timeArr.concat(itemss);
              }
            }
            // console.log(timeArr);
            //Добавлем к массиву времени возврат к дате
            let items = timeArr;
            let itemsDop = ["Выбрать другую дату"];
            Array.prototype.push.apply(items, itemsDop);
            //let dateList = dataColumn.data.values.flat();
            chose.telegram.sendMessage(
              chose.chat.id,
              "Вы выбрали дату: " +
                `${indexDate}` +
                ". \n На какое время вас записать?⏰",
              Markup.keyboard(items).oneTime().resize()
            );
            //});
          } else if (dateList.includes(checkMessage)) {
            indexDate = chose.update.message.text;
            console.log("Я тут .......");
            chose.telegram.sendMessage(
              chose.chat.id,
              "Вы выбрали дату: " +
                `${indexDate}` +
                "\n" +
                "Проверяю наличие свободного времени на данную дату..."
            );
            let dataBaseSheet = await gsapi.spreadsheets.values.batchGet({
              spreadsheetId: idSheets,
              ranges: [`${indexMaster}!A4:A`, `${indexMaster}!3:3`],
            });
            dateSheets = dataBaseSheet.data.valueRanges[1].values.flat();
            numberRecords = dataBaseSheet.data.valueRanges[0].values.length;
            timeMaster = dataBaseSheet.data.valueRanges[0].values.flat();
            // console.log(timeMaster);
            let column = 1;
            for (let i = 0; i < dateSheets.length; i++) {
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
                let itemss = timeMaster[i];
                timeArr = timeArr.concat(itemss);
              }
            }
            // console.log(timeArr);
            //Добавлем к массиву времени возврат к дате
            let items = timeArr;
            let itemsDop = ["Выбрать другую дату"];
            Array.prototype.push.apply(items, itemsDop);
            //let dateList = dataColumn.data.values.flat();
            chose.telegram.sendMessage(
              chose.chat.id,
              "На какое время вас записать?",
              Markup.keyboard(items).oneTime().resize()
            );
            //});
          } else if (anotherTime.includes(checkMessage)) {
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
            if (indexDate === currentDay) {
              let timeCurrent = moment().format();
              console.log(moment().format());
              let timeCheck = timeCurrent[timeCurrent.length - 14];
              if (timeCheck === "0") {
                timeCheck = Number(timeCurrent[timeCurrent.length - 13]);
              } else {
                timeCheck = Number(
                  timeCurrent[timeCurrent.length - 14] +
                    timeCurrent[timeCurrent.length - 13]
                );
              }
              timeCheck = timeCheck + timeZone;
              if (timeCheck >= 19) {
                timeCheck = 8;
              }
              let dataBaseSheet = await gsapi.spreadsheets.values.batchGet({
                spreadsheetId: idSheets,
                ranges: [`${indexMaster}!A4:A`, `${indexMaster}!3:3`],
              });
              dateSheets = dataBaseSheet.data.valueRanges[1].values.flat();
              numberRecords = dataBaseSheet.data.valueRanges[0].values.length;
              timeMaster = dataBaseSheet.data.valueRanges[0].values.flat();

              let time = "";
              let row = 0;
              for (i = 0; i < timeMaster.length; i++) {
                if (timeMaster[i][0] === "1") {
                  time = timeMaster[i][0] + timeMaster[i][1];
                  //  console.log(Number(time));
                  row = row + 1;
                } else {
                  time = timeMaster[i][0];
                  //  console.log(Number(time));
                  row = row + 1;
                }
                if (Number(timeCheck) <= 7) {
                  row = 0;
                  break;
                } else if (Number(time) === Number(timeCheck)) {
                  // console.log(row);
                  break;
                }
              }
              // Определим колонку с текущей датой
              let column = 1;
              for (let i = 0; i < dateSheets.length; i++) {
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

              //Определяем свободное время
              let timeArr = [];
              for (i = row; i < numberRecords + 4; i++) {
                if (timeColumn.data.values[i] == "") {
                  let itemss = timeMaster[i];
                  timeArr = timeArr.concat(itemss);
                }
              }
              // console.log(timeArr);
              //Добавлем к массиву времени возврат к дате
              let items = timeArr;
              let itemsDop = ["Выбрать другую дату"];
              Array.prototype.push.apply(items, itemsDop);
              //let dateList = dataColumn.data.values.flat();
              chose.telegram.sendMessage(
                chose.chat.id,
                "Вы выбрали дату: " +
                  `${indexDate}` +
                  ". \n🕰Выберите другое свободное время.",
                Markup.keyboard(items).oneTime().resize()
              );
            } else {
              //Определяем свободное время
              let timeArr = [];
              for (i = 0; i < numberRecords + 4; i++) {
                if (timeColumn.data.values[i] == "") {
                  let itemss = timeMaster[i];
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
                  ". \n🕰Выберите другое свободное время.",
                Markup.keyboard(items).oneTime().resize()
              );
            }
            //});
          } else if (timeMaster.includes(checkMessage)) {
            indexTime = chose.update.message.text;

            let rowTime = 4;
            for (i = 0; i < timeMaster.length; i++) {
              if (indexTime == timeMaster[i]) {
                rowTime = rowTime + i;
                indexRow = rowTime;
                break;
              }
            }
            let buttonTime = [
              "Подтвердить запись ✅",
              //"Вернуться в начало",
              "Выбрать другое время ☝️",
            ];

            chose.telegram.sendMessage(
              chose.chat.id,
              "Вы выбрали: \nМастер 💁‍♂️: " +
                `${indexMaster}` +
                "\nУслуга ✂️: " +
                `${indexService}` +
                "\nДата записи 🗓: " +
                `${indexDate}` +
                "\nВремя записи ⏰: " +
                `${indexTime}`,
              Markup.keyboard(buttonTime).oneTime().resize()
            );
          } else if (confirmEntry.includes(checkMessage)) {
            // Проверка свободно время или нет

            let recordClientArr = await gsapi.spreadsheets.values.batchGet({
              spreadsheetId: idSheets,
              ranges: [
                `${indexMaster}!R${indexRow}C${indexColumn}:R${indexRow}C${indexColumn}`,
                `${listSetting[0]}!A2:A`,
                `${listSetting[0]}!M1:M`,
                `${listSetting[0]}!O1:O`,
                `${listSetting[0]}!N1:N`,
              ],
            });

            let checkFree = recordClientArr.data.valueRanges[0].values;
            let clientBaseId =
              recordClientArr.data.valueRanges[1].values.flat();
            let adminMessage =
              recordClientArr.data.valueRanges[2].values.flat();
            let masterName = recordClientArr.data.valueRanges[3].values.flat();
            let masterIdArr = recordClientArr.data.valueRanges[4].values.flat();

            if (checkFree === undefined) {
              // Запись в таблицу (закоментирована считывание телефона)
              //let idList = idListArr.data.values.flat();
              //let checkIdClient;
              // let scoreId = 0;
              //for (i = 0; i < idList.length; i++) {
              //  checkIdClient = idList[i];
              //  if (checkIdClient == chose.chat.id) {
              //    scoreId = i;
              //    break;
              //  }
              //}
              //let indexPhoneArr = await gsapi.spreadsheets.values.get({
              //  spreadsheetId: idSheets,
              //  range: `${listSetting[0]}!R${scoreId + 2}C3:R${scoreId + 2}C3`,
              //});
              //indexPhone = indexPhoneArr.data.values.flat();

              let dateRecord = {
                values: [
                  "Клиент: " +
                    `${nameClient}` +
                    "\nУслуга: " +
                    `${indexService}`,
                  //"\nТелефон: " +
                  //`${indexPhone}`,
                ],
              };
              const updateOptions = {
                spreadsheetId: idSheets,
                range: `${indexMaster}!R${indexRow}C${indexColumn}:R${indexRow}C${indexColumn}`,
                valueInputOption: "USER_ENTERED",
                resource: { values: dateRecord },
              };
              await gsapi.spreadsheets.values.update(updateOptions);
              clearTimeout(timerId);
              chose.telegram.sendMessage(
                chose.chat.id,
                "Отлично. Вы записаны 💁‍♂️:\nМастер: " +
                  `${indexMaster}` +
                  "\nУслуга ✂️: " +
                  `${indexService}` +
                  "\nДата записи 🗓: " +
                  `${indexDate}` +
                  "\nВремя записи ⏰:" +
                  `${indexTime}`,
                Markup.keyboard(deleteRecord).oneTime().resize()
              );
              //Оповещение администраторов
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
                    `${indexTime}` +
                    //"\nТелефон: " +
                    //`${indexPhone}` +
                    "\nID: " +
                    `${chose.chat.id}`
                );
              }
              //Оповещение мастера
              for (let m = 1; m < masterName.length; m++) {
                if (`${masterName[m]}` == `${indexMaster}`) {
                  let masterId = masterIdArr[m];
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
              //Рабочая запись (первый лист) в таблицу текущей записи клиента
              //Настройка оповещения клиента за час
              let mmsHours = 3600000;
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
                indexTime[indexTime.length - 2] +
                indexTime[indexTime.length - 1];
              if (minutesRec === "0") {
                minutesRec = 0;
              }
              let hoursRec = indexTime[indexTime.length - 5];
              if (hoursRec === undefined) {
                hoursRec = Number(indexTime[indexTime.length - 4]);
                //  console.log("ok");
              } else {
                hoursRec = Number(
                  indexTime[indexTime.length - 5] +
                    indexTime[indexTime.length - 4]
                );
              }

              let currentYear = new Date().getFullYear();
              let currentDate = Date.now();
              let dateRecordsMM = new Date(
                currentYear,
                monthRec,
                dateRec,
                hoursRec,
                minutesRec
              );

              let intervalTime =
                dateRecordsMM - currentDate - mmsHours * (timeZone + 1);
              console.log(intervalTime);
              for (let n = 0; n < clientBaseId.length; n++) {
                if (`${clientBaseId[n]}` == `${chose.chat.id}`) {
                  let dateRecordClientTable = {
                    values: [
                      `${nameClient}`,
                      `${indexDate}`,
                      `${indexTime}`,
                      `${indexMaster}`,
                      `${indexService}`,
                      `${monthRec}`,
                      `${dateRec}`,
                      `${hoursRec}`,
                      `${minutesRec}`,
                    ],
                  };
                  const updateOptions1 = {
                    spreadsheetId: idSheets,
                    range: `${listSetting[0]}!R${n + 2}C4:R${n + 2}C12`,
                    valueInputOption: "RAW",
                    resource: { values: dateRecordClientTable },
                  };
                  await gsapi.spreadsheets.values.update(updateOptions1);
                  break;
                }
              }
              if (intervalTime > 0) {
                let clientBaseIdAr = await gsapi.spreadsheets.values.get({
                  spreadsheetId: idSheets,
                  range: `${listSetting[0]}!A2:A`,
                });
                let clientBaseId = clientBaseIdAr.data.values.flat();

                for (let n = 0; n < clientBaseId.length; n++) {
                  if (`${clientBaseId[n]}` == `${chose.chat.id}`) {
                    async function Setinterval() {
                      let clientLastRecords =
                        await gsapi.spreadsheets.values.get({
                          spreadsheetId: idSheets,
                          range: `${listSetting[0]}!D${n + 2}:H${n + 2}`,
                        });
                      if (clientLastRecords.data.values == "0") {
                        return chose.scene.leave();
                      }
                      let nameClient = clientLastRecords.data.values.flat()[0];
                      let indexMaster = clientLastRecords.data.values.flat()[3];
                      let indexService =
                        clientLastRecords.data.values.flat()[4];
                      let indexDate = clientLastRecords.data.values.flat()[1];
                      let indexTime = clientLastRecords.data.values.flat()[2];
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
                    const timerId = setTimeout(Setinterval, intervalTime);

                    idTimeInterval[n] = Number(timerId);
                    // console.log(idTimeInterval);

                    break;
                  }
                }
              }

              //console.log(idTimeInterval);
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
          }
          //   else {
          //    chose.telegram.sendMessage(
          //      chose.chat.id,
          //      'Неизвестная команда  👇. Сделайте выбор по кнопке "Новая запись", либо напишите слово "старт" или "запись". Пишем без кавычек',
          //      Markup.keyboard(recordNewButton).oneTime().resize()
          //    );
          //    return chose.scene.leave();
          //  }
        } catch (err) {
          console.error("Ошибка");
          chose.reply(
            'Неизвестная команда  👇. Сделайте выбор по кнопке "Новая запись", либо напишите слово "старт" или "запись". Пишем без кавычек',
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
      //check =
      let changeService = ["Заменить услугу"];
      try {
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
          serviceList.pop();
          // console.log(serviceList);
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
          chose.telegram.sendMessage(
            chose.chat.id,
            "Вы выбрали мастера: " +
              `${indexMaster}` +
              "\n" +
              "Проверяю наличие свободных дат для записи"
          );
          // Определяем колонку с текущей датой из строки 2 с датами
          dataSheets = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${indexMaster}!2:2`,
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
          dateCheck = dateCheck + timeZone;
          if (dateCheck >= 19) {
            columns = columns + 1;
          }
          //---------------------------
          //Получаем значение текущей даты
          // Ищем свободные даты
          let dateFree = [];
          let dataColumn1 = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${indexMaster}!R3C${columns}:R26C${dateArr.length}`,
          });
          let dateList = dataColumn1.data.values;
          //  console.log(dateArr.length);
          //  console.log(columns);
          for (i = 0; i <= dateArr.length - columns; i++) {
            //console.log(i);
            for (b = 1; b < 24; b++) {
              if (dateList[b][i] == "") {
                dateFree = dateFree.concat(dateList[0][i]);

                break;
              }
            }
          }
          //  dateList = dataColumn.data.values.flat();
          dateListButton = anotherMaster.concat(dateFree);
          currentDay = dateList[0][0];
          //  console.log(currentDay);
          chose.telegram.sendMessage(
            chose.chat.id,
            "Свободные даты. Уточните, на какую дату записать клиента",
            Markup.keyboard(dateListButton).oneTime().resize()
          );
        } else if (anotherDateMaster.includes(checkMessage)) {
          chose.telegram.sendMessage(
            chose.chat.id,
            "Клиент выбрал мастера: " +
              `${indexMaster}` +
              "\n" +
              "Подбирите для него другую подходящую дату",
            Markup.keyboard(dateListButton).oneTime().resize()
          );
        } else if (checkMessage == currentDay) {
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
          timeCheck = timeCheck + timeZone;
          if (timeCheck >= 19) {
            timeCheck = 8;
          }
          let dataBaseSheet = await gsapi.spreadsheets.values.batchGet({
            spreadsheetId: idSheets,
            ranges: [`${indexMaster}!A4:A`, `${indexMaster}!3:3`],
          });
          dateSheets = dataBaseSheet.data.valueRanges[1].values.flat();
          numberRecords = dataBaseSheet.data.valueRanges[0].values.length;
          timeMaster = dataBaseSheet.data.valueRanges[0].values.flat();

          let time = "";
          let row = 0;
          for (i = 0; i < timeMaster.length; i++) {
            if (timeMaster[i][0] === "1") {
              time = timeMaster[i][0] + timeMaster[i][1];
              //  console.log(Number(time));
              row = row + 1;
            } else {
              time = timeMaster[i][0];
              //  console.log(Number(time));
              row = row + 1;
            }
            if (Number(timeCheck) <= 7) {
              row = 0;
              break;
            } else if (Number(time) === Number(timeCheck)) {
              //  console.log(row);
              break;
            }
          }
          // Определим колонку с текущей датой
          let column = 1;
          for (let i = 0; i < dateSheets.length; i++) {
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

          //Определяем свободное время
          let timeArr = [];
          for (i = row + 1; i < numberRecords + 4; i++) {
            if (timeColumn.data.values[i] == "") {
              let itemss = timeMaster[i];
              timeArr = timeArr.concat(itemss);
            }
          }
          //Добавлем к массиву времени возврат к дате
          let items = timeArr;
          // let itemsDop = ["Выбрать другую дату"];
          Array.prototype.push.apply(items, anotherDateMaster);
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
          indexDate = chose.update.message.text;

          let dataBaseSheet = await gsapi.spreadsheets.values.batchGet({
            spreadsheetId: idSheets,
            ranges: [`${indexMaster}!A4:A`, `${indexMaster}!3:3`],
          });
          dateSheets = dataBaseSheet.data.valueRanges[1].values.flat();
          numberRecords = dataBaseSheet.data.valueRanges[0].values.length;
          timeMaster = dataBaseSheet.data.valueRanges[0].values.flat();
          let column = 1;
          for (let i = 0; i < dateArr.length; i++) {
            if (indexDate === dateSheets[i]) {
              column = column + i;
              break;
            }
          }

          // Определили колонку с выбранной датой
          indexColumn = column;
          //  console.log(column);
          let timeColumn = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${indexMaster}!R4C${column}:R${
              numberRecords + 4
            }C${column}`,
          });
          let time = "";
          let row = 0;
          for (i = 0; i < timeMaster.length; i++) {
            if (timeMaster[i][0] === "1") {
              time = timeMaster[i][0] + timeMaster[i][1];
              //  console.log(Number(time));
              row = row + 1;
            } else {
              time = timeMaster[i][0];
              //  console.log(Number(time));
              row = row + 1;
            }
            // if (Number(time) === Number(timeCheck)) {
            //   console.log(row);
            //   break;
            // }
          }

          //Определяем свободное время
          let timeArr = [];
          for (i = 0; i < numberRecords + 4; i++) {
            if (timeColumn.data.values[i] == "") {
              let itemss = timeMaster[i];
              timeArr = timeArr.concat(itemss);
            }
          }
          //Добавлем к массиву времени возврат к дате
          let items = timeArr;
          // let itemsDop = ["Выбрать другую дату"];
          Array.prototype.push.apply(items, anotherDateMaster);
          chose.telegram.sendMessage(
            chose.chat.id,
            "Клиент выбрал дату: " +
              `${indexDate}` +
              ". \nУточните, на какое время его записать",
            Markup.keyboard(items).oneTime().resize()
          );
          //});
        } else if (anotherTime.includes(checkMessage)) {
          let dataBaseSheet = await gsapi.spreadsheets.values.batchGet({
            spreadsheetId: idSheets,
            ranges: [`${indexMaster}!A4:A`, `${indexMaster}!3:3`],
          });
          dateSheets = dataBaseSheet.data.valueRanges[1].values.flat();
          numberRecords = dataBaseSheet.data.valueRanges[0].values.length;
          timeMaster = dataBaseSheet.data.valueRanges[0].values.flat();

          if (indexDate === currentDay) {
            let timeCurrent = moment().format();
            console.log(moment().format());
            let timeCheck = timeCurrent[timeCurrent.length - 14];
            if (timeCheck === "0") {
              timeCheck = Number(timeCurrent[timeCurrent.length - 13]);
            } else {
              timeCheck = Number(
                timeCurrent[timeCurrent.length - 14] +
                  timeCurrent[timeCurrent.length - 13]
              );
            }
            timeCheck = timeCheck + timeZone;
            if (timeCheck >= 19) {
              timeCheck = 8;
            }

            let time = "";
            let row = 0;
            for (i = 0; i < timeMaster.length; i++) {
              if (timeMaster[i][0] === "1") {
                time = timeMaster[i][0] + timeMaster[i][1];
                //  console.log(Number(time));
                row = row + 1;
              } else {
                time = timeMaster[i][0];
                //  console.log(Number(time));
                row = row + 1;
              }
              if (Number(timeCheck) <= 7) {
                row = 0;
                break;
              } else if (Number(time) === Number(timeCheck)) {
                //  console.log(row);
                break;
              }
            }
            // Определим колонку с текущей датой
            let column = 1;
            for (let i = 0; i < dateSheets.length; i++) {
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

            //Определяем свободное время
            let timeArr = [];
            for (i = row + 1; i < numberRecords + 4; i++) {
              if (timeColumn.data.values[i] == "") {
                let itemss = timeMaster[i];
                timeArr = timeArr.concat(itemss);
              }
            }
            // console.log(timeArr);
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
          } else {
            //Определяем свободное время
            let timeArr = [];
            for (i = 0; i < numberRecords + 4; i++) {
              if (timeColumn.data.values[i] == "") {
                let itemss = timeMaster[i];
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
          }
          //Добавлем к массиву времени возврат к дате

          //});
        } else if (timeMaster.includes(checkMessage)) {
          indexTime = chose.update.message.text;

          let rowTime = 4;
          for (i = 0; i < timeMaster.length; i++) {
            if (indexTime == timeMaster[i]) {
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
              range: `${listSetting[0]}!M1:M`,
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
              range: `${listSetting[0]}!O1:O`,
            });
            let masterName = masterNameArr.data.values.flat();
            for (let m = 1; m < masterName.length; m++) {
              if (`${masterName[m]}` == `${indexMaster}`) {
                let masterIdArr = await gsapi.spreadsheets.values.get({
                  spreadsheetId: idSheets,
                  range: `${listSetting[0]}!N1:N`,
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
      } catch {
        adminChatIdArr = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${listSetting[0]}!M1:M`,
        });
        let checkId = chose.chat.id.toString();
        let adminMessage = adminChatIdArr.data.values.flat();
        console.log(checkId);
        if (adminMessage.includes(checkId)) {
          chose.reply(
            'Неизвестная команда. Будьте внимательны. Сделайте выбор по кнопкам, либо напишите слово "старт" или "запись". Пишем без кавычек',
            Markup.keyboard(adminMenu).oneTime().resize()
          );
          return;
        }
        chose.reply(
          '☝️ В связи с проведением профилактическмх работ, запись необходимо начать с самого начала. \nНахмите на кнопку "Новая запись" 👇, либо напишите слово "старт" или "запись". Пишем без кавычек',
          Markup.keyboard(recordNewButton).oneTime().resize()
        );
      }
    });
    //  запись имени клиента
    nameClientSce.enter(async (chose) => {
      await chose.reply("Введите имя клиента и отправьте сообщением");
      nameClientSce.on("message", (chose) => {
        let checkName = chose.message.text;
        let checkAnswer = /^[а-яА-ЯёЁa-zA-Z0-9]+$/;

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
          range: `${listSetting[0]}!A2:A`,
        });
        let clientBaseId = clientBaseIdAr.data.values.flat();
        //  clearTimeout(timerId);
        for (let n = 0; n < clientBaseId.length; n++) {
          if (`${clientBaseId[n]}` == `${chose.chat.id}`) {
            let clientLastRecords = await gsapi.spreadsheets.values.get({
              spreadsheetId: idSheets,
              range: `${listSetting[0]}!D${n + 2}:L${n + 2}`,
            });
            if (clientLastRecords.data.values[0] == "0") {
              chose.telegram.sendMessage(
                chose.chat.id,
                'У вас нет текущих записей для удаления. Вы можете сделать новую запись. Для этого нажмите на кнопку "Новая запись" или напишите слово "запись" (пишем без кавычек).',
                Markup.keyboard(recordNewButton).oneTime().resize()
              );
              return chose.scene.leave();
            }

            clearInterval(idTimeInterval[n]);
            let nameClient = clientLastRecords.data.values.flat()[0];
            let indexMaster = clientLastRecords.data.values.flat()[3];
            let indexService = clientLastRecords.data.values.flat()[4];
            let indexDate = clientLastRecords.data.values.flat()[1];
            let indexTime = clientLastRecords.data.values.flat()[2];
            let indexRow = 4;
            let indexColumn = 2;
            let dataRecord = await gsapi.spreadsheets.values.batchGet({
              spreadsheetId: idSheets,
              ranges: [`${indexMaster}!A4:A`, `${indexMaster}!B3:3`],
            });
            let dateColumns = dataRecord.data.valueRanges[1].values.flat();
            let dateRows = dataRecord.data.valueRanges[0].values.flat();
            //console.log(dateColumns);
            for (i = 0; i < dateColumns.length; i++) {
              if (indexDate == dateColumns[i]) {
                indexColumn = indexColumn + i;
                break;
              }
            }
            for (j = 0; j < dateRows.length; j++) {
              if (indexTime == dateRows[j]) {
                indexRow = indexRow + j;
                break;
              }
            }
            //console.log(indexColumn);
            //console.log(indexRow);
            let deleteValuesWork = {
              values: ["0", "0", "0", "0", "0", "0", "0", "0", "0"],
            };
            const updateOptions1 = {
              spreadsheetId: idSheets,
              range: `${listSetting[0]}!R${n + 2}C4:R${n + 2}C12`,
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
              range: `${listSetting[0]}!M1:M`,
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
              range: `${listSetting[0]}!O1:O`,
            });
            masterName = masterNameArr.data.values.flat();
            for (let m = 1; m < masterName.length; m++) {
              if (`${masterName[m]}` == `${indexMaster}`) {
                masterIdArr = await gsapi.spreadsheets.values.get({
                  spreadsheetId: idSheets,
                  range: `${listSetting[0]}!N1:N`,
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
    worker.enter(async (ctx) => {
      let menuAdmin = ["Выбрать еще мастера"];
      let backMenu = ["Вернуться в начальное меню"];
      //---------------------------
      let dataColumnAll = await gsapi.spreadsheets.values.get({
        spreadsheetId: idSheets,
        range: `${listSheet[0]}!2:2`,
      });
      //console.log(dataColumnAll.data.values.flat().length);
      //-----------------------------
      //Получаем ID листов
      let numberCol = 0;
      let listId = new Array();
      for (i = 2; i < metaData.data.sheets.length; i++) {
        listId.push(metaData.data.sheets[i].properties.sheetId);
      }

      ctx.reply(
        "Выберите мастера",
        Markup.keyboard(listSheet).oneTime().resize()
      );
      worker.on("message", async (ctx) => {
        let answerMaster = ctx.update.message.text;
        let indexId = 0;
        let indexIdSheets;
        let menuAdmin1 = menuAdmin.concat(backMenu);

        for (i = 0; i < listSheet.length; i++) {
          if (answerMaster == listSheet[i]) {
            indexId = i;
            indexIdSheets = listId[i];
            break;
          }
        }

        if (listSheet.includes(answerMaster)) {
          let dataColumnAll = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${answerMaster}!2:2`,
          });
          let dataColumnArr = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${answerMaster}!3:3`,
          });
          let dataColumnArrOne = dataColumnArr.data.values.flat()[1];
          //---------------------------------------------
          // Определяем текущую дату из строки 2 с датами
          //Получаем номер колонки с текущей датой
          let columns = 1;
          for (let i = 0; i < dataColumnAll.data.values.flat().length; i++) {
            if (
              new Date().getMonth() + 1 + "/" + new Date().getDate() ===
              dataColumnAll.data.values.flat()[i]
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
          dateCheck = dateCheck + timeZone;
          if (dateCheck > 19) {
            columns = columns + 1;
          }

          if (
            dataColumnAll.data.values.flat()[columns - 1] ==
            dataColumnAll.data.values.flat()[1]
          ) {
            ctx.reply(
              "Вы пытаетесь удалить текущую дату. Обработайте таблицу у другого мастера или вернитесь в начальное меню",
              Markup.keyboard(menuAdmin1).oneTime().resize()
            );
            return ctx.scene.leave();
          } else {
            //---------------------------
            //Определяем последнюю колонку с датой в таблице

            let endIndex = dataColumnAll.data.values.flat().length - 1;
            let startIndex = endIndex - 1;
            //Получаем контрольный индекс из таблицы
            let recordsNewDate = await gsapi.spreadsheets.values.get({
              spreadsheetId: idSheets,
              range: [`${answerMaster}!B1:B1`],
            });
            numberCol = Number(recordsNewDate.data.values.flat()[0]) + 1;
            // console.log(numberCol);
            let recordDateNew = {
              range: `${answerMaster}!B1:B2`,
              values: [[numberCol], ["=A1+B1"]],
            };
            const updateDateNew = {
              spreadsheetId: idSheets,
              valueInputOption: "USER_ENTERED",
              resource: { data: [recordDateNew] },
            };

            let recordDateNew2 = { values: ["=B2+1"] };
            const updateDateNew2 = {
              spreadsheetId: idSheets,
              range: `${answerMaster}!C2:C2`,
              valueInputOption: "USER_ENTERED",
              resource: { values: recordDateNew2 },
            };
            const resource = {
              requests: [
                {
                  deleteDimension: {
                    range: {
                      sheetId: indexIdSheets,
                      dimension: "COLUMNS",
                      startIndex: 1,
                      endIndex: 2,
                    },
                  },
                },
              ],
            };
            const resource1 = {
              requests: [
                {
                  insertDimension: {
                    range: {
                      sheetId: indexIdSheets,
                      dimension: "COLUMNS",
                      startIndex: startIndex,
                      endIndex: endIndex,
                    },
                    inheritFromBefore: true,
                  },
                },
              ],
            };
            const response = await gsapi.spreadsheets.batchUpdate({
              spreadsheetId: idSheets,
              resource: resource,
            });
            const response1 = await gsapi.spreadsheets.batchUpdate({
              spreadsheetId: idSheets,
              resource: resource1,
            });

            let letterSheet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            //Здесь нужно посчитать на сколько дней в таблице записи
            //let a = 13;
            let index;
            let indexNewColumns;
            for (i = 0; i < letterSheet.length; i++) {
              if (i === endIndex) {
                index = letterSheet[i - 2];
                indexNewColumns = letterSheet[i - 1];
                break;
              }
            }
            //console.log(index);
            //console.log(indexNewColumns);

            let record3 = {
              values: [`=${indexNewColumns}2`],
            };
            let record4 = {
              range: `${answerMaster}!${indexNewColumns}2:${indexNewColumns}3`,
              values: [
                [`=${index}2+1`],
                [`=ПРОПИСН(ТЕКСТ(${indexNewColumns}2; "[$-F800]dddd dd.mm"))`],
              ],
            };
            const updateOptions = {
              spreadsheetId: idSheets,
              valueInputOption: "USER_ENTERED",
              resource: { data: [record4] },
            };
            await gsapi.spreadsheets.values.batchUpdate(updateOptions);

            const updateOptions3 = {
              spreadsheetId: idSheets,
              range: `${answerMaster}!${indexNewColumns}27:${indexNewColumns}27`,
              valueInputOption: "USER_ENTERED",
              resource: { values: record3 },
            };
            await gsapi.spreadsheets.values.batchUpdate(updateDateNew);
            await gsapi.spreadsheets.values.update(updateDateNew2);
            await gsapi.spreadsheets.values.update(updateOptions3);
            //  let menuAdmin = ["Выбрать еще мастера", "Вернуться в начальное меню"];
            ctx.reply(
              `Вы удалили следующую дату: ${dataColumnArrOne}. \nОбработайте таблицу у другого мастера или вернитесь в начальное меню`,
              Markup.keyboard(menuAdmin1).oneTime().resize()
            );
            return ctx.scene.leave();
          }
        } else if (answerMaster == "Вернуться в начальное меню") {
          ctx.reply(
            "Выбирайте по кнопкам",
            Markup.keyboard(adminMenu).oneTime().resize()
          );
          return ctx.scene.leave();
        }
      });
    });
  } catch (err) {
    console.error(err);
    // console.error("Ошибка");
    // bot.telegram.sendMessage(chat.id, "Ошибка");
  }
}
