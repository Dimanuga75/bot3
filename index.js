const {
  Telegraf,
  Markup,
  Extra,
  Context,
  Scenes: { WizardScene, Stage, BaseScene },
  session,
  Scenes,
} = require("telegraf");

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
bot.hears("Укажите имя клиента", Stage.enter("nameClientSce"));
bot.hears("Новая запись", Stage.enter("recordClient"));
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
const keys = require("./keys.json");
const idSheets = process.env.ID_SHEETS;
const client = new google.auth.JWT(keys.client_email, null, keys.private_key, [
  "https://www.googleapis.com/auth/spreadsheets",
]);

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
    let metaData = await gsapi.spreadsheets.get({
      spreadsheetId: idSheets,
    });
    //  console.log(metaData.data.sheets.title);
    //  Список листов (мастеров)
    function sheetnames() {
      let listSheet = new Array();
      let sheets = metaData.data.sheets;
      for (let i = 2; i < sheets.length; i++)
        listSheet.push(metaData.data.sheets[i].properties.title);
      return listSheet;
    }
    const listSheets = sheetnames();
    //Формируем список первых двух рабочих листов
    function sheetSetting() {
      let listSetting = new Array();
      for (i = 0; i < 2; i++)
        listSetting.push(metaData.data.sheets[i].properties.title);
      return listSetting;
    }
    const listSettings = sheetSetting();

    //Наши услуги
    let serviceListArr = await gsapi.spreadsheets.values.get({
      spreadsheetId: idSheets,
      range: `${listSettings[1]}!A2:A`,
    });
    let serviceList = serviceListArr.data.values.flat();

    //  Считаем количество записей  на день (по 1-му левому столбцу)
    let numberRecordsArr = await gsapi.spreadsheets.values.get({
      spreadsheetId: idSheets,
      range: `${listSheets[0]}!A4:A`,
    });
    let numberRecords = numberRecordsArr.data.values.length;

    //  Массив с данными по времени
    let timeArray = numberRecordsArr.data.values.flat();

    //  Массив дат с днями неделями
    let dateSheetsArr = await gsapi.spreadsheets.values.get({
      spreadsheetId: idSheets,
      range: `${listSheets[0]}!3:3`,
    });
    let dateSheets = dateSheetsArr.data.values.flat();

    // Определяем текущую дату из строки 2 с датами
    let dataSheets = await gsapi.spreadsheets.values.get({
      spreadsheetId: idSheets,
      range: `${listSheets[0]}!2:2`,
    });
    let dateArr = dataSheets.data.values.flat();
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
    //Получаем значение текущей даты
    let dataColumn = await gsapi.spreadsheets.values.get({
      spreadsheetId: idSheets,
      range: `${listSheets[0]}!R3C${columns}:R3C${columns + 30}`,
    });
    let dateList = dataColumn.data.values.flat();
    let currentDay = dateList[0];

    //  Получаем прай-лист
    let priceListArr = await gsapi.spreadsheets.values.get({
      spreadsheetId: idSheets,
      range: `${listSettings[1]}!B2:B`,
    });
    let priceList = priceListArr.data.values.flat();
    let textPrice = "";
    for (i = 0; i < serviceList.length; i++) {
      textPrice = textPrice + `${serviceList[i]} - ` + `${priceList[i]}` + "\n";
    }
    //-------------------------------------------

    //  let idClient;
    //  let nameClient = "";
    //  let indexMaster = "";
    //  let indexDate = "";
    //  let indexTime = "";
    //  let indexColumn = "";
    //  let indexRow = "";
    //  let indexService = "";
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
    let blackListCommand = ["777"];
    Array.prototype.push.apply(serviceList, priceButton);
    let deleteValues = {
      values: [""],
    };
    let listSheetButton = listSheets.concat(anotherService);
    let dateListButton = anotherMaster.concat(dateList);
    let blackList = [];
    //Удаление записи клиента админом ----------------
    removeChoiceAdmin.enter(async (chose) => {
      metaData = await gsapi.spreadsheets.get({
        spreadsheetId: idSheets,
      });
      function sheetnames() {
        let listSheet = new Array();
        let sheets = metaData.data.sheets;
        for (let i = 2; i < sheets.length; i++)
          listSheet.push(metaData.data.sheets[i].properties.title);
        return listSheet;
      }
      let listSheets = sheetnames();
      // let checkMessage = chose.message.text;

      await chose.reply(
        "Выберети мастера, у которого нужно удалить запись",
        Markup.keyboard(listSheets).oneTime().resize()
      );

      removeChoiceAdmin.on("message", async (chose) => {
        let checkMessage = chose.update.message.text;
        let buttonDelete = ["Удалить выбранную запись"];

        if (listSheets.includes(checkMessage)) {
          indexMaster = chose.update.message.text;
          // Определяем текущую дату из строки 2 с датами
          dataSheets = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSheets[0]}!2:2`,
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
          //Получаем значение текущей даты
          dataColumn = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSheets[0]}!R3C${columns}:R3C${columns + 30}`,
          });
          dateList = dataColumn.data.values.flat();
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
            Markup.keyboard(listSheets).oneTime().resize()
          );
        } else if (anotherDate.includes(checkMessage)) {
          // Определяем текущую дату из строки 2 с датами
          dataSheets = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSheets[0]}!2:2`,
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
          //Получаем значение текущей даты
          dataColumn = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSheets[0]}!R3C${columns}:R3C${columns + 30}`,
          });
          dateList = dataColumn.data.values.flat();
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
          //  console.log("Я в текущей дате");
          indexDate = chose.update.message.text;
          let timeCurrent = new Date().toString();
          let dateCheck = timeCurrent[timeCurrent.length - 46];
          //console.log(timeCurrent[timeCurrent.length - 46]);
          if (dateCheck === "0") {
            dateCheck = Number(timeCurrent[timeCurrent.length - 45]);
          } else {
            dateCheck = Number(
              timeCurrent[timeCurrent.length - 46] +
                timeCurrent[timeCurrent.length - 45]
            );
          }
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
            range: `${indexMaster}!R4C${column}:R${
              numberRecords + 4
            }C${column}`,
          });
          //console.log(timeColumn);
          //Определяем свободное время
          let timeArr = [];
          for (i = row + 1; i < numberRecords + 4; i++) {
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
            "Выбрана дата: " +
              `${indexDate}` +
              "\nНа какое время была сделана запись?",
            Markup.keyboard(items).oneTime().resize()
          );
          //});
        } else if (dateList.includes(checkMessage)) {
          console.log("Я тут");
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
              numberRecords + 3
            }C${column}`,
          });
          //  console.log(timeColumn.data.values.flat());
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
          //let dateList = dataColumn.data.values.flat();
          chose.telegram.sendMessage(
            chose.chat.id,
            "Выбрана дата: " +
              `${indexDate}` +
              "\nНа какое время была сделана запись?",
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
              numberRecords + 3
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
          //let dateList = dataColumn.data.values.flat();
          chose.telegram.sendMessage(
            chose.chat.id,
            "Выбрана дата: " +
              `${indexDate}` +
              "\nНа какое время была сделана запись?",
            Markup.keyboard(items).oneTime().resize()
          );
          //});
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
          adminChatIdArr = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSettings[0]}!E1:E`,
          });
          let adminMessage = adminChatIdArr.data.values.flat();
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
          let masterNameArr = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSettings[0]}!G1:G`,
          });
          let masterName = masterNameArr.data.values.flat();
          for (let m = 1; m < masterName.length; m++) {
            if (`${masterName[m]}` == `${indexMaster}`) {
              let masterIdArr = await gsapi.spreadsheets.values.get({
                spreadsheetId: idSheets,
                range: `${listSettings[0]}!F1:F`,
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
      // let idClient;
      // let nameClient = "";
      // let indexMaster = "";
      // let indexDate = "";
      // let indexTime = "";
      // let indexColumn = "";
      // let indexRow = "";
      // let indexService = "";
      nameClient = ctx.chat.first_name;
      idClient = ctx.chat.id;
      let check = ctx.chat.id.toString();
      let checkList = await gsapi.spreadsheets.values.get({
        spreadsheetId: idSheets,
        range: `${listSettings[0]}!D1:D`,
      });
      blackList = checkList.data.values.flat();

      if (blackList.includes(check)) {
        return false;
      }

      // Проверяем есть ли клиент в базе
      numberClientArr = await gsapi.spreadsheets.values.get({
        spreadsheetId: idSheets,
        range: `${listSettings[0]}!A1:A`,
      });
      numberClient = numberClientArr.data.values.length;

      if (numberClientArr.data.values.flat().includes(`${idClient}`)) {
        ctx.reply("Приветсвуем вас " + `${nameClient}`) + ". ";
        metaData = await gsapi.spreadsheets.get({
          spreadsheetId: idSheets,
        });
        //Наши услуги
        serviceListArr = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${listSettings[1]}!A2:A`,
        });
        serviceList = serviceListArr.data.values.flat();
        Array.prototype.push.apply(serviceList, priceButton);
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
            //Наши услуги
            serviceListArr = await gsapi.spreadsheets.values.get({
              spreadsheetId: idSheets,
              range: `${listSettings[1]}!A2:A`,
            });
            serviceList = serviceListArr.data.values.flat();
            Array.prototype.push.apply(serviceList, priceButton);
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
              range: `${listSettings[0]}!R${numberClient + 1}C1:R${
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
      //Проверям на админство
      let checkId = chose.chat.id.toString();
      let adminChatIdArr = await gsapi.spreadsheets.values.get({
        spreadsheetId: idSheets,
        range: `${listSettings[0]}!E1:E`,
      });
      if (!adminChatIdArr.data.values.flat().includes(checkId)) {
        chose.reply(
          'Неизвестная команда. Сделайте выбор по кнопкам, либо напишите слово "старт" или "запись". Пишем без кавычек'
        );
        return false;
      }

      checkList = await gsapi.spreadsheets.values.get({
        spreadsheetId: idSheets,
        range: `${listSettings[0]}!D1:D`,
      });
      numberClient = checkList.data.values.length;
      console.log(checkList.data.values.length);
      await bot.telegram.sendMessage(
        chose.chat.id,
        "Введите id, блокируемого пользователя. ID можно посмотреть либо в ваших оповещениях, либо в гугл таблице "
      );
      black.on("message", async (chose) => {
        let indexIDBlack = chose.update.message.text;
        let regID = /^[1-9]+[0-9]*$/;
        if (regID.test(indexIDBlack)) {
          checkList = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSettings[0]}!D1:D`,
          });
          let numberRow = checkList.data.values.length;
          console.log(checkList.data.values.length);
          let RecordBlackId = {
            values: [`${indexIDBlack}`],
          };
          const updateOptions = {
            spreadsheetId: idSheets,
            range: `${listSettings[0]}!D${numberRow + 1}:D${numberRow + 1}`,
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
      metaData = await gsapi.spreadsheets.get({
        spreadsheetId: idSheets,
      });
      sheets = metaData.data.sheets;
      let checkMessage = chose.message.text;
      nameClient = chose.chat.first_name;
      let check = chose.chat.id.toString();
      // Проверяем на черный список
      checkList = await gsapi.spreadsheets.values.get({
        spreadsheetId: idSheets,
        range: `${listSettings[0]}!D1:D`,
      });
      blackList = checkList.data.values.flat();

      if (blackList.includes(check)) {
        return false;
      } else if (recordNewButton.includes(checkMessage)) {
        serviceListArr = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${listSettings[1]}!A2:A`,
        });
        serviceList = serviceListArr.data.values.flat();
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
        //Наши услуги
        serviceListArr = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${listSettings[1]}!A2:A`,
        });
        serviceList = serviceListArr.data.values.flat();
        Array.prototype.push.apply(serviceList, priceButton);
        chose.telegram.sendMessage(
          chose.chat.id,
          "Выберите на какую услугу вас записать",
          Markup.keyboard(serviceList).oneTime().resize()
        );
      }

      recordClient.on("message", async (chose) => {
        checkMessage = chose.message.text;
        if (blackList.includes(check)) {
          return false;
        } else if (recordNewButton.includes(checkMessage)) {
          serviceListArr = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSettings[1]}!A2:A`,
          });
          serviceList = serviceListArr.data.values.flat();
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
          //Наши услуги
          serviceListArr = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSettings[1]}!A2:A`,
          });
          serviceList = serviceListArr.data.values.flat();
          Array.prototype.push.apply(serviceList, priceButton);
          chose.telegram.sendMessage(
            chose.chat.id,
            "Выберите на какую услугу вас записать",
            Markup.keyboard(serviceList).oneTime().resize()
          );
        } else if (priceButton.includes(checkMessage)) {
          serviceListArr = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSettings[1]}!A2:A`,
          });
          serviceList = serviceListArr.data.values.flat();
          priceListArr = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSettings[1]}!B2:B`,
          });
          priceList = priceListArr.data.values.flat();
          textPrice = "";
          for (i = 0; i < serviceList.length; i++) {
            textPrice =
              textPrice + `${serviceList[i]} - ` + `${priceList[i]}` + "\n";
          }
          chose.telegram.sendMessage(
            chose.chat.id,
            textPrice,
            Markup.keyboard(serviceButton).oneTime().resize()
          );
        } else if (serviceChoice.includes(checkMessage)) {
          let serviceListArr = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSettings[1]}!A2:A`,
          });
          let serviceList = serviceListArr.data.values.flat();
          Array.prototype.push.apply(serviceList, priceButton);
          nameClient = chose.chat.first_name;
          chose.telegram.sendMessage(
            chose.chat.id,
            "Выберите на какую услугу вас записать",
            Markup.keyboard(serviceList).oneTime().resize()
          );
        } else if (serviceList.includes(checkMessage)) {
          function sheetnames() {
            let listSheet = new Array();
            let sheets = metaData.data.sheets;
            for (let i = 2; i < sheets.length; i++)
              listSheet.push(metaData.data.sheets[i].properties.title);
            return listSheet;
          }
          const listSheets = sheetnames();
          listSheetButton = listSheets.concat(anotherService);
          indexService = chose.update.message.text;
          chose.telegram.sendMessage(
            chose.chat.id,
            "К какому мастеру вас записать",
            Markup.keyboard(listSheetButton).oneTime().resize()
          );
        } else if (anotherMaster.includes(checkMessage)) {
          chose.telegram.sendMessage(
            chose.chat.id,
            "Выберите мастера:",
            Markup.keyboard(listSheetButton).oneTime().resize()
          );
        } else if (listSheets.includes(checkMessage)) {
          indexMaster = chose.update.message.text;
          // Определяем текущую дату из строки 2 с датами
          dataSheets = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSheets[0]}!2:2`,
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
          //Получаем значение текущей даты
          dataColumn = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSheets[0]}!R3C${columns}:R3C${columns + 30}`,
          });
          dateList = dataColumn.data.values.flat();
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
          // Определяем текущую дату из строки 2 с датами
          dataSheets = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSheets[0]}!2:2`,
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
          //Получаем значение текущей даты
          dataColumn = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSheets[0]}!R3C${columns}:R3C${columns + 30}`,
          });
          dateList = dataColumn.data.values.flat();
          currentDay = dateList[0];
          chose.telegram.sendMessage(
            chose.chat.id,
            "Вы выбрали мастера: " +
              `${indexMaster}` +
              "\n" +
              "Посмотрите другую дату:",
            Markup.keyboard(dateListButton).oneTime().resize()
          );
        } else if (currentDay.includes(checkMessage)) {
          console.log("Я в текущей дате");
          indexDate = chose.update.message.text;
          let timeCurrent = new Date().toString();
          let dateCheck = timeCurrent[timeCurrent.length - 46];
          //console.log(timeCurrent[timeCurrent.length - 46]);
          if (dateCheck === "0") {
            dateCheck = Number(timeCurrent[timeCurrent.length - 45]);
          } else {
            dateCheck = Number(
              timeCurrent[timeCurrent.length - 46] +
                timeCurrent[timeCurrent.length - 45]
            );
          }
          //console.log(dateCheck);
          //console.log(timeCurrent);
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
            range: `${indexMaster}!R4C${column}:R${
              numberRecords + 4
            }C${column}`,
          });
          //console.log(timeColumn);
          //Определяем свободное время
          let timeArr = [];
          for (i = row + 1; i < numberRecords + 4; i++) {
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
          console.log("Я тут");
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
            "Вернуться в начало",
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
              range: `${listSettings[0]}!A2:A`,
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
              range: `${listSettings[0]}!R${scoreId + 2}C3:R${scoreId + 2}C3`,
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
              range: `${listSettings[0]}!E1:E`,
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
              range: `${listSettings[0]}!G1:G`,
            });
            let masterName = masterNameArr.data.values.flat();
            for (let m = 1; m < masterName.length; m++) {
              if (`${masterName[m]}` == `${indexMaster}`) {
                let masterIdArr = await gsapi.spreadsheets.values.get({
                  spreadsheetId: idSheets,
                  range: `${listSettings[0]}!F1:F`,
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
            let intervalTime = dateRecordsMM - currentDate - mmsHours * 2;
            //console.log(intervalTime);
            if (intervalTime > 0) {
              setTimeout(() => {
                chose.telegram.sendMessage(
                  chose.chat.id,
                  "Приветсвуем вас " +
                    `${nameClient}` +
                    ". Напоминаем вам, что Вы записаны на сегондя:\nМастер: " +
                    `${indexMaster}` +
                    "\nУслуга: " +
                    `${indexService}` +
                    "\nДата записи: " +
                    `${indexDate}` +
                    "\nВремя записи:" +
                    `${indexTime}`,
                  Markup.keyboard(deleteRecord).oneTime().resize()
                );
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
            'Неизвестная команда. Сделайте выбор по кнопкам, либо напишите слово "старт" или "запись". Пишем без кавычек'
          );
        }
      });
    });
    //-----------Конец записи клиента
    // ------------ Запись клиента админом------------------------
    bot.on("message", async (chose) => {
      let checkMessage = chose.message.text;

      metaData = await gsapi.spreadsheets.get({
        spreadsheetId: idSheets,
      });
      //Наши услуги
      serviceListArr = await gsapi.spreadsheets.values.get({
        spreadsheetId: idSheets,
        range: `${listSettings[1]}!A2:A`,
      });
      serviceList = serviceListArr.data.values.flat();

      let changeService = ["Заменить услугу"];

      if (clientRecord.includes(checkMessage)) {
        chose.telegram.sendMessage(
          chose.chat.id,
          "На какую услугу записать клиента",
          Markup.keyboard(serviceList).oneTime().resize()
        );
      } else if (serviceList.includes(checkMessage)) {
        function sheetnames() {
          let listSheet = new Array();
          let sheets = metaData.data.sheets;
          for (let i = 2; i < sheets.length; i++)
            listSheet.push(metaData.data.sheets[i].properties.title);
          return listSheet;
        }
        const listSheets = sheetnames();
        listSheetButton = listSheets.concat(changeService);
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
      } else if (listSheets.includes(checkMessage)) {
        indexMaster = chose.update.message.text;
        // Определяем текущую дату из строки 2 с датами
        dataSheets = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${listSheets[0]}!2:2`,
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
        //Получаем значение текущей даты
        dataColumn = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${listSheets[0]}!R3C${columns}:R3C${columns + 30}`,
        });
        dateList = dataColumn.data.values.flat();
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
          range: `${listSheets[0]}!2:2`,
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
        //Получаем значение текущей даты
        dataColumn = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${listSheets[0]}!R3C${columns}:R3C${columns + 30}`,
        });
        dateList = dataColumn.data.values.flat();
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
        //  console.log("Я в текущей дате");
        indexDate = chose.update.message.text;
        let timeCurrent = new Date().toString();
        let dateCheck = timeCurrent[timeCurrent.length - 46];
        //console.log(timeCurrent[timeCurrent.length - 46]);
        if (dateCheck === "0") {
          dateCheck = Number(timeCurrent[timeCurrent.length - 45]);
        } else {
          dateCheck = Number(
            timeCurrent[timeCurrent.length - 46] +
              timeCurrent[timeCurrent.length - 45]
          );
        }
        //console.log(dateCheck);
        //console.log(timeCurrent);
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
        for (i = row + 1; i < numberRecords + 4; i++) {
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
            range: `${listSettings[0]}!A2:A`,
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
            range: `${listSettings[0]}!R${scoreId + 2}C3:R${scoreId + 2}C3`,
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

          //Оповещение администраторов
          adminChatIdArr = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSettings[0]}!E1:E`,
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
                `${indexTime}` +
                "\nТелефон: " +
                `${indexPhone}` +
                "\nID: " +
                `${chose.chat.id}`,
              Markup.keyboard(adminMenu).oneTime().resize()
            );
          }
          //Оповещение мастера
          let masterNameArr = await gsapi.spreadsheets.values.get({
            spreadsheetId: idSheets,
            range: `${listSettings[0]}!G1:G`,
          });
          let masterName = masterNameArr.data.values.flat();
          for (let m = 1; m < masterName.length; m++) {
            if (`${masterName[m]}` == `${indexMaster}`) {
              let masterIdArr = await gsapi.spreadsheets.values.get({
                spreadsheetId: idSheets,
                range: `${listSettings[0]}!F1:F`,
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
        const updateOptionsDelete = {
          spreadsheetId: idSheets,
          range: `${indexMaster}!R${indexRow}C${indexColumn}:R${indexRow}C${indexColumn}`,
          valueInputOption: "USER_ENTERED",
          resource: { values: deleteValues },
        };
        await gsapi.spreadsheets.values.update(updateOptionsDelete);

        chose.telegram.sendMessage(
          chose.chat.id,
          "Мы удалили вашу запись. Вы можете записаться на другую дату. Выберайте услугу: ",
          Markup.keyboard(serviceList).oneTime().resize()
        );

        //let adminChatId = "601081115";
        adminChatIdArr = await gsapi.spreadsheets.values.get({
          spreadsheetId: idSheets,
          range: `${listSettings[0]}!E1:E`,
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
          range: `${listSettings[0]}!G1:G`,
        });
        masterName = masterNameArr.data.values.flat();
        for (let m = 1; m < masterName.length; m++) {
          if (`${masterName[m]}` == `${indexMaster}`) {
            masterIdArr = await gsapi.spreadsheets.values.get({
              spreadsheetId: idSheets,
              range: `${listSettings[0]}!F1:F`,
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
