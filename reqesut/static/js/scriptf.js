// AWS SDK の設定
AWS.config.update({
    region: 'ap-northeast-1', // 例: 'us-west-2'
    accessKeyId: 'AKIAX4XIZQBSTNYWH6LR',
    secretAccessKey: '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'
});

var docClient = new AWS.DynamoDB.DocumentClient();

var sortOrder = 'descending'; // デフォルトは降順

// ソートボタンのクリックイベントハンドラ
function sortRequests(order) {
    sortOrder = order;
    fetchRequests(); // ソート順を切り替えてデータを再取得
}

// データの取得と表示
function fetchRequests() {
    var params = {
        TableName: "request_word",
        FilterExpression: "request_type = :type",
        ExpressionAttributeValues: { ":type": "add" }
    };

    docClient.scan(params, function (err, data) {
        if (err) {
            console.error("Error:", err);
        } else {
            // データを count プロパティでソート
            var sortedData = data.Items.slice(); // データをコピー

            // count プロパティを数値に変換してソート
            sortedData.sort(function(a, b) {
                // a.count と b.count を数値に変換して比較
                return parseInt(a.count, 10) - parseInt(b.count, 10);
            });

            if (sortOrder === 'descending') {
                // 降順にする場合は逆順にソート
                sortedData.reverse();
            }

            displayRequests(sortedData);
        }
    });
}

// データの表示
function displayRequests(requests) {
    var requestsTable = document.getElementById('requests');
    requestsTable.innerHTML = '';

    requests.forEach(function(request) {
        var row = document.createElement('tr');

        // Readカラム (改善)
        var readCell = document.createElement('td');
        var readLink = document.createElement('a');
        readLink.textContent = request.Read;
        readLink.href = 'https://www.google.com/search?q=' + encodeURIComponent(request.Read);
        readLink.target = '_blank'; // 新しいタブで開く
        readCell.appendChild(readLink);
        row.appendChild(readCell);
        
        // Countカラム
        var countCell = document.createElement('td');
        countCell.textContent = request.request_count;
        row.appendChild(countCell);

        // アクションカラム（ボタン）
        var actionsCell = document.createElement('td');
        var approveButton = document.createElement('button');
        approveButton.textContent = '承認（ワードリストへ追加）';
        approveButton.addEventListener('click', function() {
            approve(request.Read);
        });
        var rejectButton = document.createElement('button');
        rejectButton.textContent = '拒否（NGリストへ追加）';
        rejectButton.addEventListener('click', function() {
            reject(request.Read);
        });
        actionsCell.appendChild(approveButton);
        actionsCell.appendChild(rejectButton);
        row.appendChild(actionsCell);

        requestsTable.appendChild(row);
    });
}


// 承認処理
function approve(read) {
    var params = {
      TableName: 'request_word', // 'request_word' テーブル名を適切な値に変更してください
      Key: {
        Read: read, // パーティションキー 'Read' の値を指定してアイテムを特定
        // 他のキー属性がある場合はここに追加します
      },
    };
  
    // アイテムを削除
    docClient.delete(params, function (err, data) {
      if (err) {
        console.error("Error deleting item from 'request_word' table:", err);
      } else {
        console.log('Item deleted from "request_word" table:', data);
  
        // 削除が成功した場合、再度リクエストを取得して表示することができます
        fetchRequests();
      }
    });
}

function reject(readValue) {
    // NG_list テーブルにデータを追加するパラメータを定義
    var ngListParams = {
        TableName: "NG_list",
        Item: {
            Read: readValue, // パーティションキー 'Read' の値を設定
            // 他の属性も必要に応じて追加できます
        },
    };

    // NG_list テーブルにデータを追加
    docClient.put(ngListParams, function(err, data) {
        if (err) {
            console.error("Error adding item to NG_list:", err);
        } else {
            console.log("Item added to NG_list:", data);
            
            // NG_list テーブルへの追加が成功したら、request_word テーブルからデータを削除
            var requestParams = {
                TableName: "request_word",
                Key: {
                    Read: readValue, // 削除対象のアイテムのパーティションキー 'Read'
                },
            };
            
            docClient.delete(requestParams, function (err, data) {
                if (err) {
                    console.error("Error deleting item from 'request_word' table:", err);
                } else {
                    console.log('Item deleted from "request_word" table:', data);
            
                    // 削除が成功した場合、再度リクエストを取得して表示することができます
                    fetchRequests();
                }
            });
        }
    });
}

fetchRequests();