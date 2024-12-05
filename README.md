# 使用

```javascript
import DBQuery from 'orm/index.js'
  methods: {
		init(){
			return DBQuery({
				onlySql:false
			}).setPath('accountBook').table('bill')
		},
		async readFile(){
			const res=await this.init().orderBy('id','ASC').paginate(2,100)
			console.log(res) 
		}
  }
```

