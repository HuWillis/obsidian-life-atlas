const field=(key,label,type='text',required=false,options=null)=>({key,label,type,required,options});
const F=field;
const schemas={
project:{name:'项目',add:'新建项目',folder:'10 工作 / 01 项目',fields:[F('title','项目名称','text',true),F('goal','项目目标','textarea',true),F('next','下一步行动'),F('status','项目状态','select',true,['进行中','暂停','已完成']),F('due','目标日期','date')]},
requirements:{name:'需求文档',folder:'需求',project:true,fields:[F('title','文档标题','text',true),F('goal','背景与目标','textarea',true),F('scope','需求范围','textarea'),F('accept','验收标准','textarea',true),F('status','状态','select',true,['草稿','待确认','已确认'])]},
decisions:{name:'方案决策',folder:'设计与决策',project:true,fields:[F('title','方案名称','text',true),F('options','备选方案与取舍','textarea',true),F('decision','选定方案与原因','textarea'),F('constraints','约束与待验证点','textarea')]},
development:{name:'开发排障记录',folder:'开发与排障',project:true,fields:[F('title','问题或实现主题','text',true),F('repro','现象与复现条件','textarea',true),F('cause','定位过程与根因','textarea'),F('fix','修复方案与验证结果','textarea')]},
validation:{name:'验证交付记录',folder:'验证与交付',project:true,fields:[F('title','验证主题','text',true),F('cases','验收用例与执行结果','textarea',true),F('result','结论','select',true,['待验证','通过','未通过']),F('links','交付物位置与待处理事项','textarea')]},
business:{name:'业务知识',folder:'10 工作 / 02 业务知识',fields:[F('title','知识标题','text',true),F('rules','业务概念与规则','textarea',true),F('boundary','适用边界','textarea'),F('source','来源与依据','textarea')]},
methods:{name:'工作方法',folder:'10 工作 / 03 工作方法',fields:[F('title','方法名称','text',true),F('scene','适用场景','textarea',true),F('steps','操作步骤','textarea',true),F('check','检查清单','textarea')]},
task:{name:'安排',add:'新增安排',fields:[F('title','安排内容','text',true),F('date','日期','date',true),F('time','开始时间','time'),F('area','所属领域','select',true,['工作','生活','学习']),F('priority','优先级','select',true,['普通','重要']),F('note','补充说明','textarea')]},
exercise:{name:'运动记录',add:'记录一次运动',folder:'20 生活 / 02 健康与运动',fields:[F('title','运动项目','text',true),F('date','运动日期','date',true),F('minutes','时长（分钟）','number',true),F('feeling','感受与身体状态','textarea')]},
trip:{name:'行程',add:'新建行程',folder:'20 生活 / 04 兴趣与出行',fields:[F('title','行程名称','text',true),F('destination','目的地','text',true),F('start','出发日期','date',true),F('end','返回日期','date',true),F('budget','预算（元）','money'),F('transport','往返交通与预订信息','textarea'),F('stay','住宿与预订信息','textarea')]},
stop:{name:'行程安排',add:'添加每日安排',fields:[F('date','行程日期','date',true),F('time','时间','time'),F('title','地点或活动','text',true),F('transport','交通方式'),F('note','预约与注意事项','textarea')]},
interest:{name:'兴趣活动',add:'计划兴趣活动',folder:'20 生活 / 04 兴趣与出行',fields:[F('title','活动名称','text',true),F('date','计划日期','date',true),F('plan','活动安排','textarea',true),F('takeaway','体验与收获','textarea')]},
study:{name:'学习笔记',add:'新增学习笔记',fields:[F('title','笔记标题','text',true),F('question','想解决的问题','textarea'),F('takeaway','学到了什么','textarea',true),F('evidence','实践或验证结果','textarea'),F('source','资料来源'),F('next','下一步实践')]},
experiment:{name:'实验记录',add:'新建实验',fields:[F('title','实验名称','text',true),F('hypothesis','目标与假设','textarea',true),F('setup','输入、基线与实验条件','textarea',true),F('result','结果与结论','textarea'),F('next','下一步')]},
course:{name:'阅读课程',add:'添加书籍或课程',folder:'30 学习 / 03 阅读与课程',fields:[F('title','书籍或课程名称','text',true),F('format','类型','select',true,['书籍','课程']),F('total','总章节数','number',true),F('completed','已完成章节数','number',true),F('goal','学习目标','textarea'),F('next','下一章节或练习')]},
diary:{name:'日记',add:'写今日日记',folder:'40 日志 / 2026 / 日记',fields:[F('date','记录日期','date',true),F('title','日记标题','text',true),F('events','今天发生了什么','textarea',true),F('takeaway','今天的收获','textarea'),F('tomorrow','明天关注什么','textarea')]},
weekly:{name:'周回顾',add:'写周回顾',folder:'40 日志 / 2026 / 周月复盘',fields:[F('title','回顾标题','text',true),F('start','开始日期','date',true),F('end','结束日期','date',true),F('progress','本周进展','textarea',true),F('blocks','卡点与原因','textarea'),F('next','下周重点','textarea',true)]},
monthly:{name:'月回顾',add:'写月回顾',folder:'40 日志 / 2026 / 周月复盘',fields:[F('title','回顾标题','text',true),F('month','月份','month',true),F('progress','工作、生活、学习的变化','textarea',true),F('adjust','需要调整的方向','textarea'),F('next','下月重点','textarea',true)]},
cash:{name:'收支',add:'记一笔',folder:'20 生活 / 03 家庭与财务',fields:[F('date','日期','date',true),F('type','收支类型','select',true,['支出','收入']),F('amount','金额（元）','money',true),F('category','分类','text',true),F('account','账户','text',true),F('title','备注')]},
invest:{name:'投资流水',add:'记录投资交易',folder:'20 生活 / 03 家庭与财务',fields:[F('date','交易日期','date',true),F('title','资产名称','text',true),F('assetType','资产类别','select',true,['基金','股票','债券','其他']),F('type','交易类型','select',true,['买入','卖出','分红']),F('amount','成交总额或分红（元）','money',true),F('fee','手续费（元）','money'),F('units','份额或数量','decimal'),F('account','投资账户','text',true),F('note','备注','textarea')]}
};

schemas.inbox={name:'收件箱',fields:[F('type','记录类型','select',true,['随手记','学习收获','待解决问题']),F('text','记录内容','textarea',true)]};
module.exports={schemas};
