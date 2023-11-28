from flask import Flask, render_template, request, redirect, url_for
import boto3
from boto3.dynamodb.conditions import Key

app = Flask(__name__)
dynamodb = boto3.resource('dynamodb')

@app.route('/add-requests', methods=['GET', 'POST'])
def add_requests():
    if request.method == 'POST':
        action = request.form.get('action')
        read_key = request.form.get('read_key')

        if action == 'approve':
            table = dynamodb.Table('word_list')
            table.put_item(Item={'Read': read_key})
        elif action == 'reject':
            table = dynamodb.Table('NG_list')
            table.put_item(Item={'Read': read_key})

        return redirect(url_for('add_requests'))

    table = dynamodb.Table('request_word')
    response = table.scan(FilterExpression=Key('Read').eq('add'))
    items = response.get('Items', [])
    sorted_items = sorted(items, key=lambda x: x.get('request_count', 0), reverse=True)

    return render_template('add-requests.html', items=sorted_items)

if __name__ == '__main__':
    app.run()
