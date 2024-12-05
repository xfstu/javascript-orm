import { Dayjs } from 'dayjs';

/** 数据库配置选项 */
export interface DBOptions {
  /** 数据库名称 */
  name: string;
  /** 数据库路径 */
  path: string;
  /** 创建时间 */
  create_time: string | number | null;
  /** 更新时间 */
  update_time: string | number | null;
  /** 是否自动维护时间字段 */
  autoTime: boolean;
  /** 时间格式化格式 */
  timeFormat: string | boolean;
  /** 是否打印SQL日志 */
  sqlLog: boolean;
  /** 是否只返回SQL而不执行 */
  onlySql: boolean;
  /** 是否自动关闭数据库连接 */
  autoClose: boolean;
}

export interface PaginationResult<T> {
	/** 当前页 */
    index: number;
		/** 分页数量 */
    size: number;
		/** 总条目 */
    total: number;
		/** 分页数量 */
    count: number;
		/** 数据集 */
    data: T[];
}

/** WHERE 条件的值类型 */
export type WhereValue = string | number | boolean | Array<string | number>;

/** WHERE 条件的操作符 */
export type WhereOperator = '=' | '>' | '<' | '>=' | '<=' | 'IN' | 'BETWEEN' | 'LIKE' | 'NOT LIKE';

declare class DBQuery {
  /**
   * 设置数据库路径
   * @param path 数据库路径
   */
  setPath(path?: string): this;

  /**
   * 打开数据库连接
   * @returns Promise<boolean> 是否成功打开
   */
  open(): Promise<boolean>;

  /**
   * 关闭数据库连接
   * @returns Promise<boolean> 是否成功关闭
   */
  close(): Promise<boolean>;

  /**
   * 设置查询的表名
   * @param tableName 表名
   */
  table(tableName: string): this;

  /**
   * 设置查询字段
   * @param fields 字段列表，默认为 '*'
   */
  field(fields?: string): this;

  /**
   * 添加 WHERE 条件
   * @param field 字段名
   * @param operator 操作符或值
   * @param value 值（可选）
   */
  where(field: string, operator: WhereOperator | WhereValue, value?: WhereValue): this;

  /**
   * 添加 OR WHERE 条件
   * @param field 字段名
   * @param operator 操作符或值
   * @param value 值（可选）
   */
  orWhere(field: string, operator: WhereOperator | WhereValue, value?: WhereValue): this;

  /**
   * 开始一个条件分组
   */
  beginGroup(): this;

  /**
   * 结束一个条件分组
   */
  endGroup(): this;

  /**
   * 添加排序条件
   * @param column 排序字段
   * @param direction 排序方向，默认 'ASC'
   */
  orderBy(column: string, direction?: 'ASC' | 'DESC'): this;

  /**
   * 添加分组条件
   * @param columns 分组字段列表
   */
  groupBy(...columns: string[]): this;

  /**
   * 添加分页限制
   * @param count 数量
   * @param offset 偏移量（可选）
   */
  limit(count: number, offset?: number): this;


	/**
	 * 分页查询
	 * @param index 当前页
	 * @param pageSize 每页数量
	 * @returns 返回分页内容
	 */
	paginate<T>(index: number, pageSize: number): Promise<PaginationResult<T>>;
	
	
  /**
   * 执行查询并返回结果集
   * @returns Promise<T[]> 查询结果数组
   */
  select<T = any>(): Promise<T[]>;

  /**
   * 查询单条记录
   * @returns Promise<T | null> 查询结果，未找到时返回 null
   */
  find<T = any>(): Promise<T | null>;

  /**
   * 插入数据
   * @param values 要插入的数据对象
   */
  insert(values: Record<string, any>): Promise<any>;

  /**
   * 批量插入数据
   * @param rows 要插入的数据对象数组
   */
  insertAll(rows: Record<string, any>[]): Promise<any>;

  /**
   * 更新数据
   * @param values 要更新的数据对象
   */
  update(values: Record<string, any>): Promise<any>;

  /**
   * 批量更新数据
   * @param rows 要更新的数据对象数组
   */
  updateAll(rows: Record<string, any>[]): Promise<void>;

  /**
   * 删除数据
   */
  delete(): Promise<any>;

  /**
   * 执行原生 SQL
   * @param sql SQL 语句
   */
  execSql(sql: string): Promise<any>;

  /**
   * 获取所有表信息
   */
  getTables(): Promise<any[]>;

  /**
   * 获取指定表信息
   * @param table 表名
   */
  getTabel(table: string): Promise<any>;

  /**
   * 检查表是否存在
   * @param tableName 表名
   */
  hashTabel(tableName: string): Promise<boolean>;
}

/**
 * 创建数据库查询实例
 * @param options 数据库配置选项
 */
declare function Db(options?: Partial<DBOptions>): DBQuery;

export default Db; 