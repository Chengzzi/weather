

$(function(){
	//选项卡组件
	function Tab(nav){
		this.$nav = $(nav).find("span");
		this.$content = $(".main-bottom").find("ul");
		this.addEvent();
	}
	//添加事件
	Tab.prototype.addEvent = function(){
		var that = this;
		this.$nav.click(function(){
			var index = $(this).index()
			that.toggle($(this),index);
		})
	}
	//选项卡切换
	Tab.prototype.toggle = function($this,index){
		this.$nav.removeClass('active');
		$this.addClass('active');
		this.$content.hide();
		$(this.$content[index]).show();
	};
	$(".inform-nav").each(function(index, el) {
		new Tab(el); //对每个nav标签实例化一个对象
	});


	

	//初始化函数
	function init(cityName){
		$.ajax({
			url:"http://api.jirengu.com/city.php",
			type:"get"
		}).done(function(result){
			new Rander(result);  //拿到当前城市，初次渲染。
			new cityStore(result); //拿到当前城市，初次添加切换城市功能。

		}).fail(function(e) {
			new Rander("北京市"); 
			new cityStore("北京市");
		});
	}


	function Rander(cityName){
		var that = this;
		this.name = cityName;
		this.$main = $(".main");
		this.$inform =  $(".information");
		this.$suggestion =  $(".Suggestion");
		this.getData(cityName);
	}
	//向接口获取天气数据
	Rander.prototype.getData = function(cityName){
		var that = this;
		$.ajax({
		url:"http://api.jirengu.com/weather.php?city="+cityName,
		type:"get"
		}).done(function(result){
			that.useData(result,cityName); // 将数据传输到数据处理函数
		}).fail(function(e) {
			console.log(e.status);
		});
	}


	//数据处理函数，将数据渲染到页面上
	Rander.prototype.useData = function(Data,cityName){
		var oData = JSON.parse(Data); 
		var informData = oData.results[0].weather_data; //天气信息前缀
		var suggestionData = oData.results[0].index; // 
		var string = "<span class='iconfont'>&#xe81c;</span>" + cityName+"<p>"+oData.date+"</p>";
		$(".city-name").html(string);

		//遍历渲染
		this.$inform.find("li").each(function(index,li){
			$(li).find("p")[0].innerText = informData[index].date;
			$(li).find("p")[1].innerText = informData[index].temperature;
			$(li).find("p")[2].innerText = informData[index].weather;
			$(li).find("p")[3].innerText = "风向："+informData[index].wind;
		})
		//由于重绘数据较多，所以尽量只改变文字，不让浏览器Reflow重新计算dom结构而影响速度。
		this.$suggestion.find("li").each(function(index,li){
			$(li).find("p")[0].innerText = suggestionData[index].tipt;
			$(li).find("p")[1].innerText = suggestionData[index].zs;
			$(li).find("p")[2].innerText = suggestionData[index].des;
		})
	}
	


	//城市切换组件
	function cityStore(cityName){
		this.local = [cityName];
		this.$add=$(".add-btn");
		this.$toggle=$(".toggle-btn");
		this.$addModle=$(".add-model");
		this.$toggleModle=$(".toggle-model");
		this.cityList = [];
		this.addEvent(); // 将事件函数添加到DOM上
	}

	//事件绑定函数
	cityStore.prototype.addEvent = function(){
		var that = this;
		this.$add.click(function(){
			that.$addModle.show();
			that.$toggleModle.hide();
		})
		this.$toggle.click(function(){
			that.$addModle.hide();
			that.$toggleModle.show();
			that.upCityList()
		})
		this.$addModle.find("#add-input").on("input",function(){
			var name = this.value;
			that.$addModle.find(".submit").attr('disabled',"disabled"); //禁止点击
			clearTimeout(that.timer); //清除重复请求
			that.timer = setTimeout(function(){ //将用户输入的数值发送请求
				$.ajax({
					url:"http://api.jirengu.com/weather.php?city="+name,
					type:"get",
					dataType:"JSON"
					}).done(function(result){
						that.expCity(result);  //将请求结果验证
					}).fail(function(e) {
						console.log(e.status);
					});
			},300); //延时减少用户快速输入时请求次数


		})
		this.$addModle.find(".close").click(function(){
			that.$addModle.hide();
		})
		this.$toggleModle.find(".close").click(function(){
			that.$toggleModle.hide();
		})
		
		this.$addModle.find(".submit").click(function(){
			var input = $("#add-input").val();
			that.addCity(input);
			$("#add-input").val("");
			$(this).attr('disabled',"disabled");
			console.log(123)
		})

		this.$toggleModle.find(".submit").click(function(){
			var tag = that.$toggleModle.find(".chose").val();
			new Rander(tag); // 选择好目标城市以后，调用数据渲染组件重绘整个页面。
		})

		this.$toggleModle.find(".delete").click(function(){
			var tag = that.$toggleModle.find(".chose").val();
			that.removeCity(tag);
		})

	}

	//城市输入合法验证方法
	cityStore.prototype.expCity = function(result){
		var input = $("#add-input").val();

		var flag = /^[\s]+$/g.test(input);   
		if(result.error === 0 && !flag && input){  //待优化
			$(".if-error").css("color","green")
			$(".if-error").text("OK");
			this.$addModle.find(".submit").removeAttr('disabled')
			console.log(result);
		}else if(result.error === -3 || flag){
			$(".if-error").css("color","red")
			$(".if-error").text("请输入正确的城市");
		}
		
	}
	
	cityStore.prototype.addCity = function(city){
		console.log(this.cityList.indexOf(city))
		if(this.cityList.indexOf(city) == -1){
			this.cityList.push(city);
			store.set("list",this.cityList);
			return
		}else{
			alert("该城市已经存在");
			return
		}
	}

	cityStore.prototype.removeCity = function(city){
		var newArr = []; //创建新城市数组
		this.cityList.forEach(function(el,index){
			console.log(index);
			if(el!=city){
				newArr.push(el); //将除了选中的城市推入新数组
			}
		})
		console.log(newArr);
		store.set("list",newArr); //将新数组存入store
		this.upCityList(); //更新城市切换列表
	}

	cityStore.prototype.upCityList = function(city){
		var that = this;
		this.cityList = store.get("list")||this.local;
		var list = this.cityList;
		var string;
		for(var i=0;i<list.length;i++){
			string += `<option>`+list[i]+`</option>`;
		}
		this.$toggleModle.find(".chose").html(string);
	}

	init();

	
	
})
