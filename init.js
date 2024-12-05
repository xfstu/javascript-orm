import DBQuery from './index'

function Query() {
	return DBQuery({
		autoClose: false
	}).setPath('accountBook')
}
async function createTable(sql, tableName, index) {
	const hashTable = await Query().hashTabel(tableName)
	if (!hashTable) {
		console.warn('数据表【' + tableName + '】不存在，正在创建')
		await Query().execSql(sql)
		if (index) {
			console.warn('数据表】' + tableName + '】需要添加索引，正在创建')
			await Query().execSql(index)
		}
		console.log(tableName + '已创建')
	} else {
		console.log('数据表【' + tableName + '】已经存在')
	}

}

async function execSQL(sql) {
	await Query().table(tableName).execSql(sql)
}

async function start() {
	const wallet =
		'CREATE TABLE "main"."wallet"( "id" INTEGER NOT NULL, "name" TEXT, "value" real, "create_time" DATE, "update_time" DATE, PRIMARY KEY ("id"));';
	await createTable(wallet, 'wallet')
	const bill =
		'CREATE TABLE "main"."bill"( "id" INTEGER NOT NULL, "date" DATE, "name" TEXT, "type" TEXT, "value" real, "wallet" TEXT, "info" TEXT, "icon" TEXT, PRIMARY KEY ("id"));'
	const billIndex = 'CREATE INDEX "main"."date" ON "bill" ("date");'
	await createTable(bill, 'bill', billIndex)
	DBQuery().close()
}

export default function create() {
	start()
}