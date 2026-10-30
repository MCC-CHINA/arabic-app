/* card-award patch · D1 行政区划示例数据（mock 用）
 * 格式与后端 D1 接口一致：[{ code, name, children: [{ code, name, children: [{ code, name }] }] }]
 * 本文件只含示例覆盖：34 个省级完整；地级市以主要城市为主；区县覆盖直辖市与
 * 广州 / 深圳 / 杭州 / 成都 / 南京 / 武汉 / 西安 / 苏州。未覆盖区县的城市在表单中
 * 自动切换为手填区县（见 card-award.js regionDistrictFallback）。
 * 生产环境请以后端下发的完整 regions.json 替换本文件，代码无需改动。 */
window.CA_REGIONS = [
  { code: "110000", name: "北京市", children: [
    { code: "110100", name: "北京市", children: [
      { code: "110101", name: "东城区" }, { code: "110102", name: "西城区" }, { code: "110105", name: "朝阳区" },
      { code: "110106", name: "丰台区" }, { code: "110107", name: "石景山区" }, { code: "110108", name: "海淀区" },
      { code: "110109", name: "门头沟区" }, { code: "110111", name: "房山区" }, { code: "110112", name: "通州区" },
      { code: "110113", name: "顺义区" }, { code: "110114", name: "昌平区" }, { code: "110115", name: "大兴区" },
      { code: "110116", name: "怀柔区" }, { code: "110117", name: "平谷区" }, { code: "110118", name: "密云区" },
      { code: "110119", name: "延庆区" } ] } ] },
  { code: "120000", name: "天津市", children: [
    { code: "120100", name: "天津市", children: [
      { code: "120101", name: "和平区" }, { code: "120102", name: "河东区" }, { code: "120103", name: "河西区" },
      { code: "120104", name: "南开区" }, { code: "120105", name: "河北区" }, { code: "120106", name: "红桥区" },
      { code: "120110", name: "东丽区" }, { code: "120111", name: "西青区" }, { code: "120112", name: "津南区" },
      { code: "120113", name: "北辰区" }, { code: "120114", name: "武清区" }, { code: "120115", name: "宝坻区" },
      { code: "120116", name: "滨海新区" }, { code: "120117", name: "宁河区" }, { code: "120118", name: "静海区" },
      { code: "120119", name: "蓟州区" } ] } ] },
  { code: "310000", name: "上海市", children: [
    { code: "310100", name: "上海市", children: [
      { code: "310101", name: "黄浦区" }, { code: "310104", name: "徐汇区" }, { code: "310105", name: "长宁区" },
      { code: "310106", name: "静安区" }, { code: "310107", name: "普陀区" }, { code: "310109", name: "虹口区" },
      { code: "310110", name: "杨浦区" }, { code: "310112", name: "闵行区" }, { code: "310113", name: "宝山区" },
      { code: "310114", name: "嘉定区" }, { code: "310115", name: "浦东新区" }, { code: "310116", name: "金山区" },
      { code: "310117", name: "松江区" }, { code: "310118", name: "青浦区" }, { code: "310120", name: "奉贤区" },
      { code: "310151", name: "崇明区" } ] } ] },
  { code: "500000", name: "重庆市", children: [
    { code: "500100", name: "重庆市", children: [
      { code: "500101", name: "万州区" }, { code: "500102", name: "涪陵区" }, { code: "500103", name: "渝中区" },
      { code: "500104", name: "大渡口区" }, { code: "500105", name: "江北区" }, { code: "500106", name: "沙坪坝区" },
      { code: "500107", name: "九龙坡区" }, { code: "500108", name: "南岸区" }, { code: "500109", name: "北碚区" },
      { code: "500112", name: "渝北区" }, { code: "500113", name: "巴南区" }, { code: "500114", name: "黔江区" },
      { code: "500115", name: "长寿区" }, { code: "500116", name: "江津区" }, { code: "500117", name: "合川区" },
      { code: "500118", name: "永川区" }, { code: "500119", name: "南川区" }, { code: "500120", name: "璧山区" },
      { code: "500151", name: "大足区" }, { code: "500152", name: "铜梁区" }, { code: "500153", name: "潼南区" },
      { code: "500154", name: "荣昌区" }, { code: "500155", name: "开州区" }, { code: "500156", name: "梁平区" },
      { code: "500157", name: "武隆区" }, { code: "500224", name: "綦江区" } ] } ] },
  { code: "440000", name: "广东省", children: [
    { code: "440100", name: "广州市", children: [
      { code: "440103", name: "荔湾区" }, { code: "440104", name: "越秀区" }, { code: "440105", name: "海珠区" },
      { code: "440106", name: "天河区" }, { code: "440111", name: "白云区" }, { code: "440112", name: "黄埔区" },
      { code: "440113", name: "番禺区" }, { code: "440114", name: "花都区" }, { code: "440115", name: "南沙区" },
      { code: "440117", name: "从化区" }, { code: "440118", name: "增城区" } ] },
    { code: "440300", name: "深圳市", children: [
      { code: "440303", name: "罗湖区" }, { code: "440304", name: "福田区" }, { code: "440305", name: "南山区" },
      { code: "440306", name: "宝安区" }, { code: "440307", name: "龙岗区" }, { code: "440308", name: "盐田区" },
      { code: "440309", name: "龙华区" }, { code: "440310", name: "坪山区" }, { code: "440311", name: "光明区" } ] },
    { code: "440400", name: "珠海市" }, { code: "440500", name: "汕头市" }, { code: "440600", name: "佛山市" },
    { code: "440700", name: "江门市" }, { code: "440800", name: "湛江市" }, { code: "440900", name: "茂名市" },
    { code: "441200", name: "肇庆市" }, { code: "441300", name: "惠州市" }, { code: "441400", name: "梅州市" },
    { code: "441600", name: "河源市" }, { code: "441700", name: "阳江市" }, { code: "441800", name: "清远市" },
    { code: "441900", name: "东莞市" }, { code: "442000", name: "中山市" }, { code: "445100", name: "潮州市" },
    { code: "445200", name: "揭阳市" }, { code: "445300", name: "云浮市" }, { code: "440200", name: "韶关市" },
    { code: "441500", name: "汕尾市" } ] },
  { code: "330000", name: "浙江省", children: [
    { code: "330100", name: "杭州市", children: [
      { code: "330102", name: "上城区" }, { code: "330105", name: "拱墅区" }, { code: "330106", name: "西湖区" },
      { code: "330108", name: "滨江区" }, { code: "330109", name: "萧山区" }, { code: "330110", name: "余杭区" },
      { code: "330113", name: "临平区" }, { code: "330114", name: "钱塘区" }, { code: "330111", name: "富阳区" },
      { code: "330112", name: "临安区" }, { code: "330122", name: "桐庐县" }, { code: "330127", name: "淳安县" },
      { code: "330182", name: "建德市" } ] },
    { code: "330200", name: "宁波市" }, { code: "330300", name: "温州市" }, { code: "330400", name: "嘉兴市" },
    { code: "330500", name: "湖州市" }, { code: "330600", name: "绍兴市" }, { code: "330700", name: "金华市" },
    { code: "330800", name: "衢州市" }, { code: "330900", name: "舟山市" }, { code: "331000", name: "台州市" },
    { code: "331100", name: "丽水市" } ] },
  { code: "320000", name: "江苏省", children: [
    { code: "320100", name: "南京市", children: [
      { code: "320102", name: "玄武区" }, { code: "320104", name: "秦淮区" }, { code: "320105", name: "建邺区" },
      { code: "320106", name: "鼓楼区" }, { code: "320111", name: "浦口区" }, { code: "320113", name: "栖霞区" },
      { code: "320114", name: "雨花台区" }, { code: "320115", name: "江宁区" }, { code: "320116", name: "六合区" },
      { code: "320117", name: "溧水区" }, { code: "320118", name: "高淳区" } ] },
    { code: "320500", name: "苏州市", children: [
      { code: "320505", name: "虎丘区" }, { code: "320506", name: "吴中区" }, { code: "320507", name: "相城区" },
      { code: "320508", name: "姑苏区" }, { code: "320509", name: "吴江区" }, { code: "320581", name: "常熟市" },
      { code: "320582", name: "张家港市" }, { code: "320583", name: "昆山市" }, { code: "320585", name: "太仓市" } ] },
    { code: "320200", name: "无锡市" }, { code: "320300", name: "徐州市" }, { code: "320400", name: "常州市" },
    { code: "320600", name: "南通市" }, { code: "320700", name: "连云港市" }, { code: "320800", name: "淮安市" },
    { code: "320900", name: "盐城市" }, { code: "321000", name: "扬州市" }, { code: "321100", name: "镇江市" },
    { code: "321200", name: "泰州市" }, { code: "321300", name: "宿迁市" } ] },
  { code: "510000", name: "四川省", children: [
    { code: "510100", name: "成都市", children: [
      { code: "510104", name: "锦江区" }, { code: "510105", name: "青羊区" }, { code: "510106", name: "金牛区" },
      { code: "510107", name: "武侯区" }, { code: "510108", name: "成华区" }, { code: "510112", name: "龙泉驿区" },
      { code: "510113", name: "青白江区" }, { code: "510114", name: "新都区" }, { code: "510115", name: "温江区" },
      { code: "510116", name: "双流区" }, { code: "510117", name: "郫都区" }, { code: "510118", name: "新津区" },
      { code: "510121", name: "金堂县" }, { code: "510129", name: "大邑县" }, { code: "510131", name: "蒲江县" },
      { code: "510181", name: "都江堰市" }, { code: "510182", name: "彭州市" }, { code: "510184", name: "崇州市" },
      { code: "510183", name: "邛崃市" }, { code: "510185", name: "简阳市" } ] },
    { code: "510300", name: "自贡市" }, { code: "510400", name: "攀枝花市" }, { code: "510500", name: "泸州市" },
    { code: "510600", name: "德阳市" }, { code: "510700", name: "绵阳市" }, { code: "510800", name: "广元市" },
    { code: "510900", name: "遂宁市" }, { code: "511000", name: "内江市" }, { code: "511100", name: "乐山市" },
    { code: "511300", name: "南充市" }, { code: "511400", name: "眉山市" }, { code: "511500", name: "宜宾市" },
    { code: "511600", name: "广安市" }, { code: "511700", name: "达州市" }, { code: "511800", name: "雅安市" },
    { code: "511900", name: "巴中市" }, { code: "512000", name: "资阳市" } ] },
  { code: "420000", name: "湖北省", children: [
    { code: "420100", name: "武汉市", children: [
      { code: "420102", name: "江岸区" }, { code: "420103", name: "江汉区" }, { code: "420104", name: "硚口区" },
      { code: "420105", name: "汉阳区" }, { code: "420106", name: "武昌区" }, { code: "420107", name: "青山区" },
      { code: "420111", name: "洪山区" }, { code: "420112", name: "东西湖区" }, { code: "420113", name: "汉南区" },
      { code: "420114", name: "蔡甸区" }, { code: "420115", name: "江夏区" }, { code: "420116", name: "黄陂区" },
      { code: "420117", name: "新洲区" } ] },
    { code: "420200", name: "黄石市" }, { code: "420300", name: "十堰市" }, { code: "420500", name: "宜昌市" },
    { code: "420600", name: "襄阳市" }, { code: "420700", name: "鄂州市" }, { code: "420800", name: "荆门市" },
    { code: "420900", name: "孝感市" }, { code: "421000", name: "荆州市" }, { code: "421100", name: "黄冈市" },
    { code: "421200", name: "咸宁市" }, { code: "421300", name: "随州市" }, { code: "422800", name: "恩施土家族苗族自治州" } ] },
  { code: "610000", name: "陕西省", children: [
    { code: "610100", name: "西安市", children: [
      { code: "610102", name: "新城区" }, { code: "610103", name: "碑林区" }, { code: "610104", name: "莲湖区" },
      { code: "610111", name: "灞桥区" }, { code: "610112", name: "未央区" }, { code: "610113", name: "雁塔区" },
      { code: "610114", name: "阎良区" }, { code: "610115", name: "临潼区" }, { code: "610116", name: "长安区" },
      { code: "610117", name: "高陵区" }, { code: "610118", name: "鄠邑区" }, { code: "610122", name: "蓝田县" },
      { code: "610124", name: "周至县" } ] },
    { code: "610200", name: "铜川市" }, { code: "610300", name: "宝鸡市" }, { code: "610400", name: "咸阳市" },
    { code: "610500", name: "渭南市" }, { code: "610600", name: "延安市" }, { code: "610700", name: "汉中市" },
    { code: "610800", name: "榆林市" }, { code: "610900", name: "安康市" }, { code: "611000", name: "商洛市" } ] },
  { code: "130000", name: "河北省", children: [
    { code: "130100", name: "石家庄市" }, { code: "130200", name: "唐山市" }, { code: "130300", name: "秦皇岛市" },
    { code: "130400", name: "邯郸市" }, { code: "130500", name: "邢台市" }, { code: "130600", name: "保定市" },
    { code: "130700", name: "张家口市" }, { code: "130800", name: "承德市" }, { code: "130900", name: "沧州市" },
    { code: "131000", name: "廊坊市" }, { code: "131100", name: "衡水市" } ] },
  { code: "140000", name: "山西省", children: [
    { code: "140100", name: "太原市" }, { code: "140200", name: "大同市" }, { code: "140300", name: "阳泉市" },
    { code: "140400", name: "长治市" }, { code: "140500", name: "晋城市" }, { code: "140600", name: "朔州市" },
    { code: "140700", name: "晋中市" }, { code: "140800", name: "运城市" }, { code: "140900", name: "忻州市" },
    { code: "141000", name: "临汾市" }, { code: "141100", name: "吕梁市" } ] },
  { code: "150000", name: "内蒙古自治区", children: [
    { code: "150100", name: "呼和浩特市" }, { code: "150200", name: "包头市" }, { code: "150300", name: "乌海市" },
    { code: "150400", name: "赤峰市" }, { code: "150500", name: "通辽市" }, { code: "150600", name: "鄂尔多斯市" },
    { code: "150700", name: "呼伦贝尔市" }, { code: "150800", name: "巴彦淖尔市" }, { code: "150900", name: "乌兰察布市" } ] },
  { code: "210000", name: "辽宁省", children: [
    { code: "210100", name: "沈阳市" }, { code: "210200", name: "大连市" }, { code: "210300", name: "鞍山市" },
    { code: "210400", name: "抚顺市" }, { code: "210500", name: "本溪市" }, { code: "210600", name: "丹东市" },
    { code: "210700", name: "锦州市" }, { code: "210800", name: "营口市" }, { code: "210900", name: "阜新市" },
    { code: "211000", name: "辽阳市" }, { code: "211100", name: "盘锦市" }, { code: "211200", name: "铁岭市" },
    { code: "211300", name: "朝阳市" }, { code: "211400", name: "葫芦岛市" } ] },
  { code: "220000", name: "吉林省", children: [
    { code: "220100", name: "长春市" }, { code: "220200", name: "吉林市" }, { code: "220300", name: "四平市" },
    { code: "220400", name: "辽源市" }, { code: "220500", name: "通化市" }, { code: "220600", name: "白山市" },
    { code: "220700", name: "松原市" }, { code: "220800", name: "白城市" }, { code: "222400", name: "延边朝鲜族自治州" } ] },
  { code: "230000", name: "黑龙江省", children: [
    { code: "230100", name: "哈尔滨市" }, { code: "230200", name: "齐齐哈尔市" }, { code: "230300", name: "鸡西市" },
    { code: "230400", name: "鹤岗市" }, { code: "230500", name: "双鸭山市" }, { code: "230600", name: "大庆市" },
    { code: "230700", name: "伊春市" }, { code: "230800", name: "佳木斯市" }, { code: "230900", name: "七台河市" },
    { code: "231000", name: "牡丹江市" }, { code: "231100", name: "黑河市" }, { code: "231200", name: "绥化市" } ] },
  { code: "340000", name: "安徽省", children: [
    { code: "340100", name: "合肥市" }, { code: "340200", name: "芜湖市" }, { code: "340300", name: "蚌埠市" },
    { code: "340400", name: "淮南市" }, { code: "340500", name: "马鞍山市" }, { code: "340600", name: "淮北市" },
    { code: "340700", name: "铜陵市" }, { code: "340800", name: "安庆市" }, { code: "341000", name: "黄山市" },
    { code: "341100", name: "滁州市" }, { code: "341200", name: "阜阳市" }, { code: "341300", name: "宿州市" },
    { code: "341500", name: "六安市" }, { code: "341600", name: "亳州市" }, { code: "341700", name: "池州市" },
    { code: "341800", name: "宣城市" } ] },
  { code: "350000", name: "福建省", children: [
    { code: "350100", name: "福州市" }, { code: "350200", name: "厦门市" }, { code: "350300", name: "莆田市" },
    { code: "350400", name: "三明市" }, { code: "350500", name: "泉州市" }, { code: "350600", name: "漳州市" },
    { code: "350700", name: "南平市" }, { code: "350800", name: "龙岩市" }, { code: "350900", name: "宁德市" } ] },
  { code: "360000", name: "江西省", children: [
    { code: "360100", name: "南昌市" }, { code: "360200", name: "景德镇市" }, { code: "360300", name: "萍乡市" },
    { code: "360400", name: "九江市" }, { code: "360500", name: "新余市" }, { code: "360600", name: "鹰潭市" },
    { code: "360700", name: "赣州市" }, { code: "360800", name: "吉安市" }, { code: "360900", name: "宜春市" },
    { code: "361000", name: "抚州市" }, { code: "361100", name: "上饶市" } ] },
  { code: "370000", name: "山东省", children: [
    { code: "370100", name: "济南市" }, { code: "370200", name: "青岛市" }, { code: "370300", name: "淄博市" },
    { code: "370400", name: "枣庄市" }, { code: "370500", name: "东营市" }, { code: "370600", name: "烟台市" },
    { code: "370700", name: "潍坊市" }, { code: "370800", name: "济宁市" }, { code: "370900", name: "泰安市" },
    { code: "371000", name: "威海市" }, { code: "371100", name: "日照市" }, { code: "371300", name: "临沂市" },
    { code: "371400", name: "德州市" }, { code: "371500", name: "聊城市" }, { code: "371600", name: "滨州市" },
    { code: "371700", name: "菏泽市" } ] },
  { code: "410000", name: "河南省", children: [
    { code: "410100", name: "郑州市" }, { code: "410200", name: "开封市" }, { code: "410300", name: "洛阳市" },
    { code: "410400", name: "平顶山市" }, { code: "410500", name: "安阳市" }, { code: "410600", name: "鹤壁市" },
    { code: "410700", name: "新乡市" }, { code: "410800", name: "焦作市" }, { code: "410900", name: "濮阳市" },
    { code: "411000", name: "许昌市" }, { code: "411100", name: "漯河市" }, { code: "411200", name: "三门峡市" },
    { code: "411300", name: "南阳市" }, { code: "411400", name: "商丘市" }, { code: "411500", name: "信阳市" },
    { code: "411600", name: "周口市" }, { code: "411700", name: "驻马店市" } ] },
  { code: "430000", name: "湖南省", children: [
    { code: "430100", name: "长沙市" }, { code: "430200", name: "株洲市" }, { code: "430300", name: "湘潭市" },
    { code: "430400", name: "衡阳市" }, { code: "430500", name: "邵阳市" }, { code: "430600", name: "岳阳市" },
    { code: "430700", name: "常德市" }, { code: "430800", name: "张家界市" }, { code: "430900", name: "益阳市" },
    { code: "431000", name: "郴州市" }, { code: "431100", name: "永州市" }, { code: "431200", name: "怀化市" },
    { code: "431300", name: "娄底市" }, { code: "433100", name: "湘西土家族苗族自治州" } ] },
  { code: "450000", name: "广西壮族自治区", children: [
    { code: "450100", name: "南宁市" }, { code: "450200", name: "柳州市" }, { code: "450300", name: "桂林市" },
    { code: "450400", name: "梧州市" }, { code: "450500", name: "北海市" }, { code: "450600", name: "防城港市" },
    { code: "450700", name: "钦州市" }, { code: "450800", name: "贵港市" }, { code: "450900", name: "玉林市" },
    { code: "451000", name: "百色市" }, { code: "451100", name: "贺州市" }, { code: "451200", name: "河池市" },
    { code: "451300", name: "来宾市" }, { code: "451400", name: "崇左市" } ] },
  { code: "460000", name: "海南省", children: [
    { code: "460100", name: "海口市" }, { code: "460200", name: "三亚市" }, { code: "460300", name: "三沙市" },
    { code: "460400", name: "儋州市" } ] },
  { code: "520000", name: "贵州省", children: [
    { code: "520100", name: "贵阳市" }, { code: "520200", name: "六盘水市" }, { code: "520300", name: "遵义市" },
    { code: "520400", name: "安顺市" }, { code: "520500", name: "毕节市" }, { code: "520600", name: "铜仁市" },
    { code: "522300", name: "黔西南布依族苗族自治州" }, { code: "522600", name: "黔东南苗族侗族自治州" },
    { code: "522700", name: "黔南布依族苗族自治州" } ] },
  { code: "530000", name: "云南省", children: [
    { code: "530100", name: "昆明市" }, { code: "530300", name: "曲靖市" }, { code: "530400", name: "玉溪市" },
    { code: "530500", name: "保山市" }, { code: "530600", name: "昭通市" }, { code: "530700", name: "丽江市" },
    { code: "530800", name: "普洱市" }, { code: "530900", name: "临沧市" } ] },
  { code: "540000", name: "西藏自治区", children: [
    { code: "540100", name: "拉萨市" }, { code: "540200", name: "日喀则市" }, { code: "540300", name: "昌都市" },
    { code: "540400", name: "林芝市" }, { code: "540500", name: "山南市" }, { code: "540600", name: "那曲市" } ] },
  { code: "620000", name: "甘肃省", children: [
    { code: "620100", name: "兰州市" }, { code: "620200", name: "嘉峪关市" }, { code: "620300", name: "金昌市" },
    { code: "620400", name: "白银市" }, { code: "620500", name: "天水市" }, { code: "620600", name: "武威市" },
    { code: "620700", name: "张掖市" }, { code: "620800", name: "平凉市" }, { code: "620900", name: "酒泉市" },
    { code: "621000", name: "庆阳市" }, { code: "621100", name: "定西市" }, { code: "621200", name: "陇南市" } ] },
  { code: "630000", name: "青海省", children: [
    { code: "630100", name: "西宁市" }, { code: "630200", name: "海东市" } ] },
  { code: "640000", name: "宁夏回族自治区", children: [
    { code: "640100", name: "银川市" }, { code: "640200", name: "石嘴山市" }, { code: "640300", name: "吴忠市" },
    { code: "640400", name: "固原市" }, { code: "640500", name: "中卫市" } ] },
  { code: "650000", name: "新疆维吾尔自治区", children: [
    { code: "650100", name: "乌鲁木齐市" }, { code: "650200", name: "克拉玛依市" }, { code: "650400", name: "吐鲁番市" },
    { code: "650500", name: "哈密市" } ] },
  { code: "810000", name: "香港特别行政区", children: [] },
  { code: "820000", name: "澳门特别行政区", children: [] },
  { code: "710000", name: "台湾省", children: [] }
];
