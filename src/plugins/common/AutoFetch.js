// 自动更新，从构造中获取system和location(以此获知自己的host)

class Connection {
  /**
   *
   * @param {*} commitIdSupplier 可以获取commitId
   * @param {*} updater 执行获取新API的方法
   * @param {*} location  可以获取 //: 开头的地址function
   * @param {String} id  id
   * @param {String} branch  branch
   */
  constructor(commitIdSupplier, updater, location, id, branch) {
    // super();
    console.log("create connection for ", id, ",", branch);
    this.match = this.match.bind(this);
    this.close = this.close.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
    this.createSocket = this.createSocket.bind(this);
    this.id = id;
    this.branch = branch;
    this.location = location;
    this.createSocket();
    this.commitIdSupplier = commitIdSupplier;
    this.updater = updater;
  }

  createSocket(){
    if(this.closed){
      console.log('链接已关闭');
      return;
    }
    this.socket = new WebSocket("ws:" + this.location("/watchProjectApi/" + this.id + "/" + this.branch));
    this.socket.onmessage = this.onUpdate;
    this.socket.onclose = this.createSocket;
  }

  /**
   *
   * @param {MessageEvent} event
   */
  onUpdate(event) {
    // https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent
    // event.data
    console.log('recieved from WS:',event.data);
    if (event.data != this.commitIdSupplier()) {
      // 执行
      this.updater(this.id, this.branch);
    }
  }

  match(id, branch) {
    return id == this.id && branch == this.branch;
  }

  close() {
    this.closed = true;
    console.log("close connection for ", this.id, ",", this.branch);
    this.socket.close();
  }
}

// 需要监听
var currentConnection;
/**
 *
 * @param {*} system UI系统
 * @param {*} location 可以获取 //: 开头的地址function
 */
export default function(system, location) {
  const store = system.getSystem().getStore();

  function checkConnection() {
    // 我们只关注我们的common数据
    // const common = store.getStore().get("common");
    const { commonSelectors, commonActions } = system.getSystem();
    var id = commonSelectors.currentApiId();
    var branch = commonSelectors.currentBranch();
    // var commitId = commonSelectors.currentCommitId(common);
    if (!currentConnection || !currentConnection.match(id, branch)) {
      if (currentConnection) currentConnection.close();
      if (!id || !branch) return;
      currentConnection = new Connection(
        commonSelectors.currentCommitId,
        commonActions.get,
        location,
        id,
        branch
      );
    }
  }

  store.subscribe(checkConnection);

  checkConnection();
}
