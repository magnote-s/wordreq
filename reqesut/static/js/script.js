$(document).ready(function() {
    // 追加リクエストの件数を取得
    $.get('/api/requests/count/add', function(data) {
        $('#add-requests-count').text(`(${data.count})`);
    }).fail(function(error) {
        console.error('Error fetching add request count:', error);
    });

    // 削除リクエストの件数を取得
    $.get('/api/requests/count/remove', function(data) {
        $('#remove-requests-count').text(`(${data.count})`);
    }).fail(function(error) {
        console.error('Error fetching remove request count:', error);
    });
});

function checkWord() {
    var word = $('#wordInput').val();
    $.get('/check-word', {word: word})
        .done(function(data) {
            $('#result').text(data.message);
        })
        .fail(function() {
            $('#result').text("サーバーからの応答に問題があります。");
        });
}