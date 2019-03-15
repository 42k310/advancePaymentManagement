// -------------------------------------------------------------------------
// スラッシュコマンド[/book target amount payment_date]を受け取り、amountパラメータをそのまま返却する
// @target: 立て替えた人
// @amount: 立て替えた金額
// @payment_date: 支払った日（≠記帳した日ではなく）
// @note: 備考
// -------------------------------------------------------------------------
function doPost(params) {
    // ------------------------
    // 変数・定数定義
    // ------------------------
    // [memo]アクセストークンは[ファイル]→[プロジェクトのプロパティ]→[スクリプトのプロパティ]で定義
    var token = PropertiesService.getScriptProperties().getProperty('SLACK_ACCESS_TOKEN');
    var botName = "記帳bot";
    var botIcon = "http://icon-rainbow.com/i/icon_02181/icon_021810_256.jpg";
    var app = SlackApp.create(token);
    var today = new Date();
    var year = String(today.getYear());
    var month = String(today.getMonth() + 1);

    // ------------------------
    // バリデーション
    // ------------------------
    // トークン
    var verificationToken = params.parameter.token;
    if (verificationToken != '[AppのVerification Tokenを入れる]') {
        throw new Error('Invalid token');
    }

    // ------------------------
    // paramsの分割処理（/book target amount payment_date）
    // TODO: 第一引数「target」はユーザーIDを取得して、自動的に判別したい
    // ------------------------
    var separatorString = /\s+/;
    var paramsText = params.parameter.text
    var arrayParams = paramsText.split(separatorString);

    // paramsバリデーション
    // TODO: パラメータのバリデーションを実装する
    // パラメータが4つ以下であること
    if (arrayParams.length > 4) {
        // Slackに「5つ以上のparamsが指定されています」と返す
        var payload = {
            'username': "Validation",
            'text': "5つ以上のparamsが指定されています!",
            'channel': "#[チャンネル名]",
            'icon_emoji': ":chart_with_upwards_trend:"
        };
        var options = {
            'method': 'post',
            'contentType': 'application/json',
            'payload': JSON.stringify(payload),
        };

        // Webhook URL
        var url = '[incoming webhookのURL]';
        UrlFetchApp.fetch(url, options);
        return url;
    }
    // 半角スペースで区切られていること
    // 【内容チェック】k or rであること/数字であること/日付であること

    // ------------------------
    // スプレッドシートへ転記（支払った人/支払い金額/支払日/計上日）
    // ------------------------
    // スプレッドシートの情報を取得
    var ss = SpreadsheetApp.openByUrl('[spreadsheetのURL]');
    var tgtSheet = ss.getSheetByName(year + month);
    if (tgtSheet != null) {
        // ターゲットシートがあったら、データを入力
        var inputrow = tgtSheet.getLastRow() + 1;
        (arrayParams[0] != null) ? tgtSheet.getRange(inputrow, 1).setValue(arrayParams[0]) : Logger.log('空です'); // target
        (arrayParams[1] != null) ? tgtSheet.getRange(inputrow, 2).setValue(arrayParams[1]) : Logger.log('空です'); // amount
        (arrayParams[2] != null) ? tgtSheet.getRange(inputrow, 3).setValue(arrayParams[2]) : Logger.log('空です'); // payment_date
        tgtSheet.getRange(inputrow, 4).setValue(today); // execute_date
        (arrayParams[3] != null) ? tgtSheet.getRange(inputrow, 5).setValue(arrayParams[3]) : Logger.log('空です'); // note
    } else {
        // ターゲットシートが無かったら、シートをつくってデータを入力
        var ss_sheet_temp = ss.getSheetByName("template");
        var tgtSheet = ss_sheet_temp.copyTo(ss);
        tgtSheet.setName(year + month);
        var inputrow = tgtSheet.getLastRow() + 1;
        (arrayParams[0] != null) ? tgtSheet.getRange(inputrow, 1).setValue(arrayParams[0]) : Logger.log('空です'); // target
        (arrayParams[1] != null) ? tgtSheet.getRange(inputrow, 2).setValue(arrayParams[1]) : Logger.log('空です'); // amount
        (arrayParams[2] != null) ? tgtSheet.getRange(inputrow, 3).setValue(arrayParams[2]) : Logger.log('空です'); // payment_date
        tgtSheet.getRange(inputrow, 4).setValue(today); // execute_date
        (arrayParams[3] != null) ? tgtSheet.getRange(inputrow, 5).setValue(arrayParams[3]) : Logger.log('空です'); // note
    }

    // ------------------------
    // slackへ返信
    // ------------------------
    var ss_url = ss.getUrl();
    var sh_id = tgtSheet.getSheetId();
    var sh_url = ss_url + "#gid=" + sh_id;
    var message = "記帳完了。\n\n" + paramsText + "\n" + sh_url;
    app.postMessage('SLACK_TARGET_CHANNEL', message, {
        username: botName,
        icon_url: botIcon
    });

    //残高の出力（不要？）
    var res = {"text": message};
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}