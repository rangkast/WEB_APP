import { exporter } from './exporter';
import { loader } from './loader';
import { AbstractPlugin } from '../../core/plugin.abstract';


export class FileManager extends AbstractPlugin {
  static meta = {
    name: 'file-manager',
  };

  constructor(configs) {
    super(configs);
    this.port = '8082';
    this.front_port = '8081';
    this.address = 'http://10.157.15.19'
    this.user_id = -1;
    this.DEBUG = 0;
    if (this.DEBUG)
      console.log("address: " + this.address + ":" + this.port);
    const menuItems = document.querySelectorAll('.plugin-file-manager');
    menuItems.forEach((item) => {
      item.addEventListener('click', (event) => this.dispatchEvent(event, item.dataset.event));
    });

    this.fakeLink = document.createElement('a');
    this.fakeLink.style.display = 'none';
    document.body.appendChild(this.fakeLink);

    this.fakeInput = document.createElement('input');
    this.fakeInput.type = 'file';
    this.fakeInput.accept = '.vxl';
    this.fakeInput.style.display = 'none';
    document.body.appendChild(this.fakeInput);

    this.fakeInput.addEventListener('change', (event) => this.fileSelected(event));

    //init default
    this.dbList();
  }
  
  clickListener (event, eventName) {
    if (this.DEBUG)
      console.log('clickListener: ' + eventName);
    var eventString = eventName.toString();
    if (eventString.includes('list:')) {
      var jbSplit = eventString.split(':');
      this.dbOpen(jbSplit[1]);
      this.user_id = jbSplit[1];
    }    
  };

  dispatchEvent(event, eventName) {
    if (this.DEBUG)
      console.log('dispatchEvent: ' + eventName);
    switch (eventName) {
      case 'new':
        this.user_id = -1;
        this.handleNew();
        break;
      case 'filesave':
        this.handleSave();
        break;
      case 'fileopen':
        this.handleOpen();
        break;
      case 'dbsave':
        this.dbSave(this.user_id);
        setTimeout(() => this.dbList(), 100);        
        break;       
      case 'dbopen':
        this.dbList();
        break;
      default:
        break;
    }
  }

  clearScene() {
    const { scene } = this.configs;
    const { sceneObjects } = this.configs;
    scene.remove(...sceneObjects);
    sceneObjects.splice(0, sceneObjects.length);
  }

  handleNew() {
    if (this.DEBUG)
      console.log('handleNew!');
    if (window.confirm('Are you sure you want to create a new file?')) {
      this.clearScene();
      this.configs.render();
    }
  }

  handleSave() {
    if (this.DEBUG)
      console.log('handleSave!');
    const data = exporter(this.configs.sceneObjects);
    const output = JSON.stringify(data, null, 2);
    if (this.DEBUG)
      console.log(output);    
    this.fakeLink.href = URL.createObjectURL(new Blob([output], { type: 'text/plain' }));
    this.fakeLink.download = 'scene.vxl';
    this.fakeLink.click();    
  }

  handleOpen() {
    if (this.DEBUG)
      console.log('handleOpen!');
    this.fakeInput.click();
  }

  dbSave(user_id) {
    const data = exporter(this.configs.sceneObjects);
    var cmd_data;
    if (user_id == -1) {
      cmd_data = {"cmd": 'dbInsert', "data" : data};
    } else {
      cmd_data = {"cmd": 'dbUpdate', "data" : data, "id" : user_id};
    }    
    const output = JSON.stringify(cmd_data, null, 2);
    //front app server 전달 (json)
    fetch(this.address + ":" + this.front_port +"/save", {
      method : "post",
      headers : {
        "Content-Type" : "application/json",
      },
      body:output,
    })
    .then(res => res.json())
    .then(res => {
      //callback 예외처리 ToDO
      if (this.DEBUG)
        console.log(res.result + " " + res.data);
    })
  }

  dbOpen(user_id) {
    if (this.DEBUG)
      console.log('dbOpen! ' + user_id);
    var data = {"cmd": 'dbOpen', "data" : user_id};
    fetch(this.address + ":" + this.front_port + '/load', {
      method: 'post',
      headers : {
        "Content-Type" : "application/json",
      },
      body:JSON.stringify(data, null, 2),  
    })
    .then(res => res.json())
    .then(res => {
      //callback 예외처리 ToDO
      if (this.DEBUG)
        console.log(res.result + " " + res.data);

      if (res.result == 'success') {    

        const { THREE } = this.configs;
        const { scene } = this.configs;
        const { sceneObjects } = this.configs;

        const reader = new FileReader();
        //byte 형태로 변경 후 걍 넣음, 된다.
        reader.readAsText(new Blob([res.data], { type: 'text/plain' }));

        reader.onload = () => {
          this.clearScene();

          const data = loader(THREE, reader.result);
          data.forEach((voxel) => {
            scene.add(voxel);
            sceneObjects.push(voxel);
          });
          this.configs.render();
        };
      } else {
        
      }

    })
  }

  dbList() {
    fetch(this.address + ":" + this.front_port + "/dblist", {
      method : "post",
    })
    .then(res => res.json())
    .then(res => {
      //callback 예외처리 ToDO
      if (res.result == 'fail') {
        this.updateList('error');
      } else {
        var list = new Array();
        var i;
        list = res.data;
        if (list != null) {
          if (this.DEBUG) {
            console.log(res.result + " " + list.length);
            for (i = 0; i < list.length; i++) {
              console.log(list[i].user_id + " " + list[i].item_name + " " 
              + list[i].item_price + " " + list[i].json_data);
            }
          }
        }
        this.updateList(list);
        if (this.DEBUG)
          console.log('done');
      }
    })
  }

  updateList(data) {
        var i, li;
        var list = new Array();

        if (data == null || data.length == 0) {
          li = "<p>No datas in DB</p>";
          li +="<p>Make new voxel</p>";
          li +="<p style='display:inline-block'>File->New->(edit)->DB Save</p>";
          list.push(li); 
        } else if (data == 'error') {
          li = "<p>Session disconnected</p>";
          list.push(li); 
        } else {
          for (i = 0; i < data.length; i++) {
            li = "<li class='pure-menu-item pure-menu-link plugin-db-manager' data-event= ' list:" + data[i].user_id + "'>";
            li += "<div>";
            li += "<img src='" + "../src/static/fab.png" + "' loading='lazy' style='width:50px;height:50px;display:inline-block'/>";
            li += "<h3 style='display:inline-block'>" + "[" + data[i].user_id + "]" +"</h3>";
            li += "<p style='display:inline-block'>" + " : " + data[i].item_name + "</p>";
            li += "</div> \
                  </li>";
            list.push(li);      
          }
        }
        
        this.tag_id = document.getElementById('listview_layout');        
        this.tag_id.removeEventListener('click', this.clickListener);
        this.tag_id.innerHTML = list;    
   
        const menuItems = document.querySelectorAll('.plugin-db-manager');
        menuItems.forEach((item) => {
          item.addEventListener('click', (event) => this.clickListener(event, item.dataset.event));
        });
  }

  fileSelected(event) {
    const { files } = event.target;
    const { THREE } = this.configs;
    const { scene } = this.configs;
    const { sceneObjects } = this.configs;

    if (files && files.length) {
      const reader = new FileReader();
      reader.readAsText(files[0]);

      reader.onload = () => {
        this.clearScene();

        const data = loader(THREE, reader.result);
        data.forEach((voxel) => {
          scene.add(voxel);
          sceneObjects.push(voxel);
        });
        this.configs.render();
      };
    }
    event.target.value = null;
  }
}
