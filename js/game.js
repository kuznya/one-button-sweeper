//==============================================================================
// * MineSweeper Model
function CModel(cfg)
{
    this.init(cfg)
    this.placeMines()
}

//----------------------------------------------------------
CModel.prototype.init = function(cfg)
{
    this.cfg = cfg

    var mines = []
    for (var i=0; i<cfg.res_y; i++)
        mines.push( new Array(cfg.res_x).fill(0) )
    //dbg(mines)
    this.mines = mines;

    var flags = []
    for (var i=0; i<cfg.res_y; i++)
        flags.push( new Array(cfg.res_x).fill(0) )
    this.flags = flags;

    var counts = []
    for (var i=0; i<cfg.res_y; i++)
        counts.push( new Array(cfg.res_x).fill(-1) )
    this.counts = counts;
}

//----------------------------------------------------------
CModel.prototype._checkCoord = function(y, x)
{
    var cfg = this.cfg
    return (0<=y && y<cfg.res_y && 0<=x && x<cfg.res_x);
}

//----------------------------------------------------------
CModel.prototype._getMine = function(y, x)
{
    if (!this._checkCoord(y,x)) return 0;
    return this.mines[y][x];
}

//----------------------------------------------------------
CModel.prototype._getFlag = function(y, x)
{
    if (!this._checkCoord(y,x)) return 0;
    return this.flags[y][x] || (this.counts[y][x] === -10); // flag or boom
}

//----------------------------------------------------------
CModel.prototype.placeMines = function()
{
    var cfg = this.cfg
    var mines = this.mines
    var cnt = cfg.nof_mines
    var base = cfg.res_y
    while(cnt){
        var rnd = rand(cfg.res_y*cfg.res_x)
        var y = Math.floor(rnd/base)
        var x = rnd % base
        if (!mines[y][x]) {
            mines[y][x]=1;
            cnt--;
        }
    }
}

//----------------------------------------------------------
CModel.prototype.getCellStatus = function(y, x)
{
    if (!this._checkCoord(y,x))     return 'out'
    if (this.flags[y][x])           return 'flag'
    var cnt = this.counts[y][x];
    if (cnt===-1)                   return 'fogged'
    if (cnt===-10)                  return 'boom'
    return 'cnt'+cnt;
}

//----------------------------------------------------------
CModel.prototype._getFogg = function(y, x)
{
    return +(this.getCellStatus(y,x)==='fogged');
}


//----------------------------------------------------------
CModel.prototype.openCell = function(y, x)
{
    var cl = this.getCellStatus(y,x)
    if (cl!=='fogged') return -1;

    if (this.mines[y][x])
    {
        this.counts[y][x] = -10
        return -10;
    }
    var cnt =
        this._getMine(y-1,x-1)+this._getMine(y-1,x)+this._getMine(y-1,x+1)+
        this._getMine(y  ,x-1)+                     this._getMine(y  ,x+1)+
        this._getMine(y+1,x-1)+this._getMine(y+1,x)+this._getMine(y+1,x+1);
    this.counts[y][x] = cnt;
    return cnt;
}

//----------------------------------------------------------
CModel.prototype.countFlags = function(y, x)
{
    var cnt =
        this._getFlag(y-1,x-1)+this._getFlag(y-1,x)+this._getFlag(y-1,x+1)+
        this._getFlag(y  ,x-1)+                     this._getFlag(y  ,x+1)+
        this._getFlag(y+1,x-1)+this._getFlag(y+1,x)+this._getFlag(y+1,x+1);
    return cnt;
}

//----------------------------------------------------------
CModel.prototype.countFoggs = function(y, x)
{
    var cnt =
        this._getFogg(y-1,x-1)+this._getFogg(y-1,x)+this._getFogg(y-1,x+1)+
        this._getFogg(y  ,x-1)+                     this._getFogg(y  ,x+1)+
        this._getFogg(y+1,x-1)+this._getFogg(y+1,x)+this._getFogg(y+1,x+1);
    return cnt;
}

//----------------------------------------------------------
CModel.prototype.flagCell = function(y, x)
{
    var cfg = this.cfg
    if (this.counts[y][x]!==-1) return false;
    // so closed
    this.flags[y][x] = +!this.flags[y][x]
}


//==============================================================================

//----------------------------------------------------------
function CGame()
{
    this.cfg  = { res_x:20, res_y:20, nof_mines:40 }
    this.init()
}


//----------------------------------------------------------
CGame.prototype.init = function()
{
    this.model = new CModel(this.cfg)
    var area = $('#field')
    this.area = area
    this.putField()

    var this1 = this
    area.find('div')
        .on('click', function(e){
            //dbg('cl-l')
            e.preventDefault()
            this1.openCell(this)
        })
        .on('contextmenu', function(e){
            //dbg('cl-r')
            e.preventDefault()
            this1.flagCell(this)
        });
}

//----------------------------------------------------------
CGame.prototype.getCoord = function(id)     { return id.split('_').map(function(v){ return parseInt(v) }) }

//----------------------------------------------------------
CGame.prototype.getId    = function(y, x)    { return y+'_'+x }

//----------------------------------------------------------
CGame.prototype.putField = function()
{
    var cfg = this.cfg
    var area = this.area
    var aa = []
    var s, id
    for (var i=0; i<cfg.res_y; i++)
        for (var j=0; j<cfg.res_x; j++)
        {
            id = this.getId(i,j)
            s = '<div id="'+id+'"></div>'
            aa.push(s)
        }
    area.html(aa.join(''))
}

//----------------------------------------------------------
CGame.prototype.redrawField = function()
{
    var cfg = this.cfg
    var area = this.area
    area.find('div').removeClass()
    var id
    for (var i=0; i<cfg.res_y; i++)
        for (var j=0; j<cfg.res_x; j++)
        {
            id = this.getId(i,j)
            var cl = this.model.getCellStatus(i,j)
            if (cl!=='fogged') { area.find('#'+id).addClass(cl); }
        }
}

//----------------------------------------------------------
CGame.prototype._addAuto = function(a, y, x)
{
    if ('fogged' === this.model.getCellStatus(y,x)) a.push([y,x])
}

//----------------------------------------------------------
CGame.prototype._addAutos = function(a, y, x)
{
    this._addAuto(a, y-1, x-1)
    this._addAuto(a, y-1, x  )
    this._addAuto(a, y-1, x+1)

    this._addAuto(a, y  , x-1)
    this._addAuto(a, y  , x+1)

    this._addAuto(a, y+1, x-1)
    this._addAuto(a, y+1, x  )
    this._addAuto(a, y+1, x+1)
}

//----------------------------------------------------------
CGame.prototype.flagCells = function(a)
{
    for (var i=0; i<a.length; i++) {
        var y = a[i][0], x = a[i][1];
        this.model.flagCell(y,x);
    }
}

//----------------------------------------------------------
CGame.prototype.autoCell = function(y1, x1)
{
    var a = []
    var y=y1, x=x1;

    var cl = this.model.getCellStatus(y,x)
    // fogged, flag, boom, cntN, out

    // click opened
    if (cl.substr(0,3)==='cnt') {
        var mines = parseInt(cl.substr(3));
        dbg(mines,'mines')
        var flags = this.model.countFlags(y,x);
        dbg(flags,'flags')
        var foggs = this.model.countFoggs(y,x);
        dbg(foggs,'foggs')

        if (mines === flags) {
            // all flags are set
            this._addAutos(a,y,x); // open all foggs
        } else if (mines === (flags+foggs)) {
            // all foggs are mines
            var b = []; // new list for flags
            this._addAutos(b,y,x);
            this.flagCells(b); // flag all foggs
        }
    }

    // click fogged
    if (cl==='fogged') a.push([y,x])

    // flag, boom, out -> empty array

    for (var i = 0; i<a.length; i++)
    {
        y = a[i][0]
        x = a[i][1]
        var cl = this.model.getCellStatus(y,x)
        // fogged, flag, boom, cntN, out
        if (cl!=='fogged') continue;

        var cnt = this.model.openCell(y,x)

        if (!cnt) {
            // zero mines near
            this._addAutos(a,y,x)
        }
        //dbg(a.length)
        //alert(i)
    }
    dbg(a.length)
}

//----------------------------------------------------------
CGame.prototype.openCell = function(ctx)
{
    var self = $(ctx)
    var id = self.attr('id')
    var crd = this.getCoord(id)
    dbg(crd)
    this.autoCell(crd[0],crd[1])
    this.redrawField()
}

//----------------------------------------------------------
CGame.prototype.flagCell = function(ctx)
{
    var self = $(ctx)
    var id = self.attr('id')
    var crd = this.getCoord(id)
    var y = crd[0]
    var x = crd[1]
    dbg(crd)
    this.model.flagCell(y,x)
    this.redrawField()
}

