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
        ExpressionAttributeValues: { ":type": "remove" }
    };

    docClient.scan(params, function (err, data) {
        if (err) {
            console.error("Error:", err);
        } else {
            // データを count プロパティでソート
            var sortedData = data.Items.slice(); // データをコピー
            if (sortOrder === 'ascending') {
                sortedData.sort((a, b) => a.count - b.count); // 昇順
            } else {
                sortedData.sort((a, b) => b.count - a.count); // 降順
            }
            if (sortOrder === 'descending') {
                // 降順にする場合は逆順にソート
                sortedData.reverse();
            }

            var filteredData = sortedData.filter(function (item) {
                return item.reqc !== 'yes';
            });

            displayRequests(filteredData); // フィルタリングされたデータを表示
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
        approveButton.textContent = '承認（NGリストに追加）';
        approveButton.addEventListener('click', function() {
            approve(request.Read);
        });
        var rejectButton = document.createElement('button');
        rejectButton.textContent = '拒否（リクエストは残ります）';
        rejectButton.addEventListener('click', function() {
            reject(request.Read);
        });
        actionsCell.appendChild(approveButton);
        actionsCell.appendChild(rejectButton);
        row.appendChild(actionsCell);

        requestsTable.appendChild(row);
    });
}


function approve(readValue) {
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

function reject(readValue) {
    // 更新するアイテムのキーを定義
    var updateParams = {
        TableName: "request_word",
        Key: {
            Read: readValue
        },
        // 更新式を指定
        UpdateExpression: "SET reqc = :reqc",
        ExpressionAttributeValues: {
            ":reqc": "yes"
        }
    };

    // アイテムを更新
    docClient.update(updateParams, function (err, data) {
        if (err) {
            console.error("Error updating item in 'request_word' table:", err);
        } else {
            console.log('Item updated in "request_word" table:', data);

            // 更新が成功した場合、再度リクエストを取得して表示することができます
            fetchRequests();
        }
    });
}

fetchRequests();