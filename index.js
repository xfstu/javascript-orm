const dayjs = require('dayjs')
class DBQuery {
	options = {
		name: 'main',
		path: '_doc/database/mydb.db',
		create_time: null,
		update_time: null,
		autoTime: true,
		timeFormat: 'YYYY-MM-DD HH:mm:ss',
		sqlLog: true,
		onlySql: false,
		autoClose: true
	}

	openNumber = 0
	tableName = null
	fields = '*'; // 默认字段
	conditions = []; // 条件数组
	values = {}; // 用于 insert 和 update
	limitClause = null;
	orderConditions = [];
	constructor(options) {
		const opt = {
			...this.options,
			...options
		}
		if (typeof opt.timeFormat == 'string') {
			opt.create_time = opt.update_time = dayjs().format(this.options.timeFormat)
		} else {
			opt.create_time = opt.update_time = dayjs().unix()
		}

		if (options?.path && !options.path.indexOf('/') !== -1) {
			opt.path = '_doc/database/' + options.path
		}
		this.options = opt
		this.initConf()
	}

	initConf() {
		this.fields = '*'; // 默认字段
		this.conditions = []; // 条件数组
		this.values = {}; // 用于 insert 和 update 
		this.limitClause = null;
		this.orderConditions = []
		this.limitCondition = null
	}

	setPath(path) {
		path ? this.options.path = '_doc/database/' + path + '.db' : ''
		return this
	}

	/**
	 * 打开数据库
	 */
	open() {
		const _this = this
		return new Promise((reslove, reject) => {
			const isOpen = plus.sqlite.isOpenDatabase(_this.options)
			console.log(isOpen)
			if (isOpen) {
				console.log('数据库已打开', isOpen)
				return reslove(true)
			} else {
				console.log('数据库未打开，正在打开')
				plus.sqlite.openDatabase({
					name: _this.options.name,
					path: _this.options.path,
					success: () => {
						console.log('数据库已打开')
						reslove(true)
					},
					fail(err) {
						console.log(plus.sqlite.isOpenDatabase(_this.options))
						console.error(err)
						reslove(false)
					}
				})
			}
		})
	}

	/**
	 * 执行原生SQL
	 * @param {Object} sql
	 */
	execSql(sql) {
		const _this = this
		let exec = 'executeSql'
		if (sql.indexOf('select') !== -1 || sql.indexOf('SELECT') !== -1 || sql.indexOf('PRAGMA') !== -1) {
			exec = 'selectSql'
		}
		this.reset()
		return new Promise((resolve, reject) => {
			_this.open()
				.then(() => {
					if (_this.options.onlySql) {
						console.log('SQL: ' + sql)
						return resolve(sql)
					}
					if (_this.options.sqlLog) {
						console.log('SQL: ' + sql)
					}
					plus.sqlite[exec]({
						name: _this.options.name,
						sql: sql,
						success: (res) => {
							if (exec == 'executeSql') {
								resolve(true)
								return
							}
							resolve(res)
						},
						fail: (err) => {
							console.error('ERROR：' + err.message)
							resolve(null)
						}
					})
				})
				.catch((res) => {
					console.log(res)
					uni.showToast({
						title: "数据库打开失败",
						icon: "error"
					})
					// reject()
				})
		});
	}

	/**
	 * 关闭数据库
	 */
	close() {
		const _this = this
		setTimeout(function() {
			const isOpen=plus.sqlite.isOpenDatabase({
				name:_this.options.name,
				path:_this.options.path
			})
			if(!isOpen){
				return true
			}
			return new Promise((reslove, reject) => {
				plus.sqlite.closeDatabase({
					name: _this.options.name,
					success() {
						console.log('数据库已关闭')
						reslove(true)
					},
					fail(err) {
						console.error(err)
						reslove(false)
					}
				})
			})
		}, 10000)
	}

	/**
	 * 添加普通条件
	 */
	where(field, operator, value) {
		if (arguments.length === 2) {
			value = operator;
			operator = '=';
		}

		if (operator.toLowerCase() === 'in' && Array.isArray(value)) {
			const inValues = value.map(v => (typeof v === 'string' ? `'${v}'` : v)).join(', ');
			this.conditions.push(`${field} IN (${inValues})`);
		} else if (operator.toLowerCase() === 'between' && Array.isArray(value) && value.length === 2) {
			this.conditions.push(`${field} BETWEEN ${value[0]} AND ${value[1]}`);
		} else {
			const formattedValue = typeof value === 'string' ? `'${value}'` : value;
			this.conditions.push(`${field} ${operator} ${formattedValue}`);
		}

		return this;
	}

	/**
	 * 添加 OR 条件
	 */
	orWhere(field, operator, value) {
		if (arguments.length === 2) {
			value = operator;
			operator = '=';
		}

		if (this.conditions.length === 0) {
			return this.where(field, operator, value);
		}

		if (operator.toLowerCase() === 'in' && Array.isArray(value)) {
			const inValues = value.map(v => (typeof v === 'string' ? `'${v}'` : v)).join(', ');
			this.conditions.push(`OR ${field} IN (${inValues})`);
		} else {
			const formattedValue = typeof value === 'string' ? `'${value}'` : value;
			this.conditions.push(`OR ${field} ${operator} ${formattedValue}`);
		}

		return this;
	}

	/**
	 * 添加 LIMIT 条件
	 */
	limit(count, offset = null) {
		if (!Number.isInteger(count) || count <= 0) {
			throw new Error('Limit count must be a positive integer');
		}

		if (offset !== null && (!Number.isInteger(offset) || offset < 0)) {
			throw new Error('Limit offset must be a non-negative integer');
		}

		this.limitCondition = offset === null ? `LIMIT ${count}` : `LIMIT ${offset}, ${count}`;
		return this;
	}

	/**
	 * 分页方法
	 * @param {number} page 当前页码（从1开始）
	 * @param {number} pageSize 每页记录数
	 */
	async paginate(page, pageSize) {
		if (!Number.isInteger(page) || page <= 0) {
			throw new Error('Page number must be a positive integer');
		}
		if (!Number.isInteger(pageSize) || pageSize <= 0) {
			throw new Error('Page size must be a positive integer');
		}

		const offset = (page - 1) * pageSize;
		this.options.autoClose = false
		const res = await this.limit(pageSize, offset).select();
		const countRes = await this.execSql("SELECT COUNT(id) count FROM " + this.tableName + ";")
		this.close()
		const count = countRes[0].count
		const obj = {
			index: page,
			size: pageSize,
			total: count,
			count: Math.ceil(count / pageSize),
			data: res
		}
		return obj
	}

	/**
	 * 开始一个嵌套分组
	 */
	beginGroup() {
		if (this.conditions.length > 0) {
			this.conditions.push('AND (');
		} else {
			this.conditions.push('(');
		}
		return this;
	}

	/**
	 * 结束一个嵌套分组
	 */
	endGroup() {
		this.conditions.push(')');
		return this;
	}

	/**
	 * 构建 WHERE 子句
	 */
	toSql() {
		let sql = '';

		if (this.conditions.length > 0) {
			const whereClause = this.conditions.reduce((acc, condition) => {
				if (acc === '') return condition;

				if (condition.startsWith('OR') || condition.startsWith('AND') || condition === '(' || condition === ')') {
					return `${acc} ${condition}`;
				}

				return `${acc} AND ${condition}`;
			}, '');

			sql += `WHERE ${whereClause}`;
		}

		if (this.orderConditions.length > 0) {
			const orderClause = this.orderConditions.join(', ');
			sql += (sql ? ' ' : '') + `ORDER BY ${orderClause}`;
		}

		// LIMIT 子句
		if (this.limitCondition) {
			sql += (sql ? ' ' : '') + this.limitCondition;
		}
		return sql.trim();
	}

	/**
	 * 重置构造器状态
	 */
	reset() {
		this.initConf()
		return this;
	}


	/**
	 * 添加 ORDER BY 条件
	 */
	orderBy(field, direction = 'ASC') {
		const validDirections = ['ASC', 'DESC'];
		direction = direction.toUpperCase();

		if (!validDirections.includes(direction)) {
			throw new Error(`Invalid sort direction: ${direction}`);
		}

		this.orderConditions.push(`${field} ${direction}`);
		return this;
	}


	executeSql(sql) {
		return this.execSql(sql)
	}

	selectSql(sql) {
		return this.execSql(sql)
	}

	table(table) {
		this.tableName = table
		return this;
	}

	// 设置字段
	field(fields = '*') {
		this.fields = fields;
		return this;
	}

	isSetTable() {
		if (!this.tableName) {
			this.reset()
			throw "SQL错误：没有设置表名称，请执行.table(tableName)"
		}
		return true;
	}

	/**
	 * 查询数据
	 */
	async select() {
		this.isSetTable()
		const sql = 'SELECT ' + this.fields + ' FROM ' + this.tableName + ' ' + this.toSql()
		const res = await this.execSql(sql)
		if (this.options.autoClose) {
			this.close()
		}
		return res
	}

	/**
	 * 分页查询
	 */
	page(pageNum, pageSize) {

	}

	/**
	 * 插入数据
	 * @param {Object} values
	 */
	async insert(values) {
		this.isSetTable()
		if (this.options.autoTime) {
			values = {
				...values,
				...{
					create_time: this.options.create_time,
					update_time: this.options.update_time
				}
			}
		}
		this.values = values;
		const keys = Object.keys(values).join(', ');
		const vals = Object.values(values)
			.map(value => (typeof value === 'string' ? `'${value}'` : value))
			.join(', ');
		console.log(this.tableName)
		const SQL = `INSERT INTO ${this.tableName} (${keys}) VALUES (${vals});`;
		// console.log(SQL)
		const res = await this.execSql(SQL)
		if (this.options.autoClose) {
			this.close()
		}
		return res
	}

	/**
	 * 更新数据 
	 * @param {Object} values
	 */
	async update(values) {
		this.isSetTable()
		if (this.options.autoTime) {
			values = {
				...values,
				...{
					update_time: this.options.update_time
				}
			}
		}
		this.values = values;
		const updates = Object.entries(values)
			.map(([key, value]) => `${key} = ${typeof value === 'string' ? `'${value}'` : value}`)
			.join(', ');
		const whereClause = this.conditions.length > 0 ? ` WHERE ${this.conditions.join(' AND ')}` : '';
		const SQL = `UPDATE ${this.tableName} SET ${updates}${whereClause};`;
		// return this.executeSql(SQL)
		const res = await this.execSql(SQL)
		if (this.options.autoClose) {
			this.close()
		}
		return res
	}

	async updateAll(rows) {
		this.isSetTable()
		this.options.autoClose = false
		for (let i = 0; i < rows.length; i++) {
			await this.update(row)
		}
		this.close()
		this.options.autoClose = true
	}

	save(row) {

	}

	/**
	 * 删除数据
	 */
	async delete() {
		this.isSetTable()
		const whereClause = this.conditions.length > 0 ? ` WHERE ${this.conditions.join(' AND ')}` : '';
		const SQL = `DELETE FROM ${this.tableName}${whereClause};`;
		const res = await this.execSql(SQL)
		if (this.options.autoClose) {
			this.close()
		}
		return res
	}

	// 批量插入数据
	async insertAll(rows) {
		this.isSetTable()
		if (!Array.isArray(rows) || rows.length === 0) {
			throw new Error('The input must be a non-empty array of objects.');
		}

		// 获取列名
		const keys = Object.keys(rows[0]);
		// 生成值部分
		const values = rows.map(row => {
			const rowValues = keys.map(key =>
				typeof row[key] === 'string' ? `'${row[key]}'` : row[key]
			);
			return `(${rowValues.join(', ')})`;
		});

		const SQL = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES ${values.join(', ')};`;
		const res = await this.execSql(SQL)
		if (this.options.autoClose) {
			this.close()
		}
		return res
	}

	async find() {
		this.isSetTable()
		const list = await this.select()
		return list.length ? list[0] : null
	}


	/**
	 * 获取所有表
	 */
	getTables() {
		return this.execSql("select * FROM sqlite_master where type='table';")
	}

	getTabel(table) {
		return this.execSql("select * FROM sqlite_master where type='table' AND name='" + table + "'")
	}

	/**
	 * 查看某个表是否存在
	 */
	async hashTabel(tableName) {
		const table = await this.execSql("SELECT name FROM sqlite_master WHERE type='table' AND name='" + tableName + "'")
		if (table.length != 0 && table[0].name == tableName) {
			return true
		}
		return false
	}

}

export default function Db(options) {
	return new DBQuery(options)
}