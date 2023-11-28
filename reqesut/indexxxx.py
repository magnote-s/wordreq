import boto3
import re

# DynamoDBのテーブルから単語を取得する関数
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

while True:
    # NGリストの読み込み
    ng_list = get_ng_list()

    # プレイヤーに単語を入力してもらう
    input_word = input("単語を入力してください（終了するには 'exit' と入力）: ")

    # 終了コマンドのチェック
    if input_word.lower() == 'exit':
        break

    # 単語の有効性チェック
    if not is_valid_hiragana_word(input_word):
        print(f"入力された単語 '{input_word}' は無効です。")
    else:
        # DynamoDBからword_listテーブルを検索
        word_item = get_word_from_dynamodb("word_list", input_word)

        # 検索結果の処理
        if word_item is not None:
            print(f"単語 '{input_word}' はword_listに存在します。")
        elif input_word in ng_list:
            print(f"単語 '{input_word}' はNGリストに含まれています。")
        else:
            print(f"単語 '{input_word}' はword_listにもNGリストにも存在しません。")
            add_word = input("この単語をrequest_wordに追加しますか？(はい/いいえ): ")

            if add_word.lower() == 'はい':
                add_response = add_word_to_request_list(input_word, 'add')
                if add_response:
                    print(f"単語 '{input_word}' をrequest_wordに追加リクエストとして追加しました。")
                else:
                    print("単語の追加リクエストに失敗しました。")
            else:
                add_to_request_word = input("この単語を削除リクエストとして追加しますか？(はい/いいえ): ")
                if add_to_request_word.lower() == 'はい':
                    request_word_response = add_word_to_request_list(input_word, 'remove')
                    if request_word_response:
                        print(f"単語 '{input_word}' を削除リクエストとしてrequest_wordに追加しました。")
                    else:
                        print("削除リクエストの追加に失敗しました。")