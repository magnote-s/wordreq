from flask import Flask, request, jsonify, send_from_directory
import boto3
from boto3.dynamodb.conditions import Key
import re


app = Flask(__name__, static_folder='static')

# DynamoDBの設定
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('request_word')  # DynamoDBのテーブル名

# DynamoDBから追加リクエストの件数を取得するAPIエンドポイント
@app.route('/api/requests/count/add')
def count_add_requests():
    response = table.scan(
        FilterExpression=Key('request_type').eq('add')
    )
    count = len(response.get('Items', []))
    return jsonify({'count': count})

# DynamoDBから削除リクエストの件数を取得するAPIエンドポイント
@app.route('/api/requests/count/remove')
def count_remove_requests():
    response = table.scan(
        FilterExpression=Key('request_type').eq('remove')
    )
    count = len(response.get('Items', []))
    return jsonify({'count': count})

# ルートURLで静的ファイル（index.html）を提供
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

if __name__ == '__main__':
    app.run(debug=True)
    
def get_word_from_dynamodb(word_list, word):
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(word_list)  # テーブル名を指定

    response = table.get_item(Key={'Read': word})  # 'Read'はパーティションキー

    if 'Item' in response:
        return response['Item']
    else:
        return None

def get_ng_list():
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table("NG_list")  # NG_listテーブル名を指定

    try:
        response = table.scan()  # テーブルからすべてのアイテムをスキャン
        ng_words = [item['Read'] for item in response.get('Items', [])]
        return ng_words
    except Exception as e:
        print(f"NGリストの読み込み中にエラーが発生しました: {e}")
        return []

def add_word_to_request_list(word, request_type):
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table("request_word")  # request_listテーブル名を指定

    try:
        # 既存アイテムのリクエストカウントを取得し、なければ0とする
        existing_item = table.get_item(Key={'Read': word})
        current_count = existing_item['Item']['request_count'] if 'Item' in existing_item else 0

        # リクエストカウントを1増やしてアイテムを追加または更新
        response = table.put_item(
            Item={
                'Read': word,
                'request_type': request_type,
                'request_count': current_count + 1  # カウントを更新
            }
        )
        return response
    except Exception as e:
        print(f"request_wordへの単語の追加中にエラーが発生しました: {e}")
        return None

def is_valid_hiragana_word(word):
    # ひらがなまたは「ー」で構成されているかをチェックする正規表現
    hiragana_pattern = r'^[\u3040-\u309Fー]+$'

    # 単語が2文字以上かつ「ん」で終わらないかをチェック
    if len(word) >= 2 and not word.endswith('ん') and re.match(hiragana_pattern, word):
        return True
    else:
        return False
    
@app.route('/check-word', methods=['GET'])
def check_word():
    word = request.args.get('word')
    if not is_valid_hiragana_word(word):
        return jsonify({'message': f"入力された単語 '{word}' は無効です。"})
    
    word_item = get_word_from_dynamodb("word_list", word)
    ng_list = get_ng_list()

    if word_item is not None:
        return jsonify({'message': f"単語 '{word}' はword_listに存在します。"})
    elif word in ng_list:
        return jsonify({'message': f"単語 '{word}' はNGリストに含まれています。"})
    else:
        return jsonify({'message': f"単語 '{word}' はword_listにもNGリストにも存在しません。"})

if __name__ == '__main__':
    app.run(debug=True)