var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var expect = chai.expect;
chai.use(chaiAsPromised);

var lsys = require('../dist/lindenmayer');
var test = new lsys.LSystem({
  word: 'F++F++F',
  productions: {
    'F': 'F-F++F-F'
  }});
test.transformClassicParametricWord('A (1, 2.5, 1234)  B(2, 3, 5)');

describe('Correct behavior of L-Systems', function() {

  it('should generate the string for the Koch-curve', function() {
    var koch = new lsys.LSystem({
      word: 'F++F++F',
      productions: {
        'F': 'F-F++F-F'
      }
    });

    expect(koch.iterate()).to.equal('F-F++F-F++F-F++F-F++F-F++F-F');

    expect(koch.iterate()).to.equal('F-F++F-F-F-F++F-F++F-F++F-F-F-F++F-F++F-F++F-F-F-F++F-F++F-F++F-F-F-F++F-F++F-F++F-F-F-F++F-F++F-F++F-F-F-F++F-F');

    expect(koch.iterate()).to.equal('F-F++F-F-F-F++F-F++F-F++F-F-F-F++F-F-F-F++F-F-F-F++F-F++F-F++F-F-F-F++F-F++F-F++F-F-F-F++F-F++F-F++F-F-F-F++F-F-F-F++F-F-F-F++F-F++F-F++F-F-F-F++F-F++F-F++F-F-F-F++F-F++F-F++F-F-F-F++F-F-F-F++F-F-F-F++F-F++F-F++F-F-F-F++F-F++F-F++F-F-F-F++F-F++F-F++F-F-F-F++F-F-F-F++F-F-F-F++F-F++F-F++F-F-F-F++F-F++F-F++F-F-F-F++F-F++F-F++F-F-F-F++F-F-F-F++F-F-F-F++F-F++F-F++F-F-F-F++F-F++F-F++F-F-F-F++F-F++F-F++F-F-F-F++F-F-F-F++F-F-F-F++F-F++F-F++F-F-F-F++F-F');


    var wordFromGenerator = koch.iterate();
    expect(wordFromGenerator).to.equal(koch.word);
  });


  it('should execute final functions to draw eg. visualizations.', function() {
    var vizsys = new lsys.LSystem({
      word: 'A---',
      productions: {
        'A': 'AARA-BB-B',
        'B': 'ABBA-+--B+-',
        'R': 'RA-'
      },
      finals: {
        'A': () => {vizsys.output += '/'},
        'B': () => {vizsys.output += '#'},
        'R': () => {vizsys.output += '~'},
        '-': () => {vizsys.output += '-'},
        '+': () => {vizsys.output += '+'}
      }
    });

    vizsys.output = '';

    vizsys.iterate(2);
    vizsys.final();
    expect(vizsys.output).to.equal('//~/-##-#//~/-##-#~/-//~/-##-#-/##/-+--#+-/##/-+--#+--/##/-+--#+----');
  });

  it('Final functions must be functions. Should throw an error on any other type.', function() {
    var vizsys = new lsys.LSystem({
      word:'A',
      productions: {'A': 'Z'},
      finals: {'Z': 'A_STRING'}
    });

    expect(function () {
      vizsys.iterate();
      vizsys.final();
    }).to.throw(/not a function/);

    expect(function () {
      vizsys.finals.set('Z', 7);
      vizsys.final();
    }).to.throw(/not a function/);

    expect(function () {
      vizsys.finals.set('Z', new Date())
      vizsys.final()
    }).to.throw(/not a function/)

    var rotation = 5
    expect(function () {
      vizsys.finals.set('Z', () => {rotation *= 2});
      vizsys.final();
    }).to.not.throw(/not a function/);

    expect(rotation).to.equal(10);
  });


  it('Helper functions for context sensitive productions should work properly. Especially with branches.', function() {

    var cs_lsys = new lsys.LSystem({
      word: 'ACBC[-Q]D--[A[FDQ]]E-+FC++G',
      productions: {
        'C': ({index, word}) => (cs_lsys.match({direction: 'right', match: 'DEF', index})) ? 'Z' : 'C'
      },
      branchSymbols: '[]',
      ignoredSymbols: '+-/'
    });

    expect(cs_lsys.iterate()).to.equal('ACBZ[-Q]D--[A[FDQ]]E-+FC++G');

  });

  it('Context sensitive L-System should work inside explicitly wanted branches', function() {
    // this example is taken from ABOP S. 32
    var cs_lsys3 = new lsys.LSystem({
      word: 'ABC[DE][SG[HI[JK]L]MNO]',
      productions: {
        'S': ({index, word}) =>
        (
          cs_lsys3.match({direction: 'right', match: 'G[H]M', index, branchSymbols: ['[', ']']}) &&
          cs_lsys3.match({direction: 'left', match: 'BC', index, branchSymbols: ['[', ']']})
        ) ? 'Z' : 'S'
      }
    });
    expect(cs_lsys3.iterate()).to.equal('ABC[DE][ZG[HI[JK]L]MNO]');


    var cs_lsys4 = new lsys.LSystem({
      word: 'ABC[DE][FG[HI[JK]L]MNO]',
      productions: {
        'H': ({index, word}) =>  (
          cs_lsys4.match({direction: 'right', match: 'I[K]L', index, branchSymbols: '[]'}))
          ? 'Z' : 'H'
        }

      })
      // I[K]L should not apply to I[JK]L
      expect(cs_lsys4.iterate()).to.not.equal('ABC[DE][FG[ZI[JK]L]MNO]');


      var cs_lsys5 = new lsys.LSystem({
        word: 'S][ED]CBA',
        productions: {
          'S': ({index}) =>  ( cs_lsys5.match({direction: 'right', match: 'CB', index, branchSymbols: '[]'})) ? 'Z' : 'S'
        }

      });
      // as required by ABOP S. 32 (reversed string)
      expect(cs_lsys5.iterate()).to.equal('Z][ED]CBA');

    });




    it('Context sensitive L-System helper function match() should work in L-Systems that don\'t use branches/brackets.', function() {
      var cs_lsys6 = new lsys.LSystem({
        word: 'A+++C-DE-+F&GH++-',
        productions: {
          'C': ({index}) =>
          (cs_lsys6.match({direction: 'right', match: 'DEFG', index, ignoredSymbols: '+-&'})) ? 'Z' : 'C'

      }
    });
    expect(cs_lsys6.iterate()).to.equal('A+++Z-DE-+F&GH++-');
  });




  it('Classic context sensitive syntax should work.', function() {
    var cs_lsys7 = new lsys.LSystem({
      word: 'A[X]BC',
      productions: {'A<B>C': 'Z'}
    });

    expect(cs_lsys7.iterate()).to.equal('A[X]ZC');
  });

  it('Left side, classic CS should work.', function() {
    var cs_lsys8 = new lsys.LSystem({
      word: 'ABC[DE][SG[HI[JK]L]MNO]',
      productions: {'BC<S': 'Z'}
    });
    expect(cs_lsys8.iterate()).to.equal('ABC[DE][ZG[HI[JK]L]MNO]');
  });

  it('right side, classic CS should work.', function() {
    var cs_lsys8 = new lsys.LSystem({
      word: 'ABC[DE][SG[HI[JK]L]MNO]',
      productions: {'S>G[H]M': 'Z'}
    });
    expect(cs_lsys8.iterate()).to.equal('ABC[DE][ZG[HI[JK]L]MNO]');
  });


  it('Custom parametric L-Systems (that dont use `params`) should work.', function() {
    var custom_para_lsys1 = new lsys.LSystem({
      word: [
        {varter: 'A', x:1, y:0.5},
        {varter: 'B', x:0, y:5},
        {varter: 'C', x:0, y:2, foo: 'bar'},
        {varter: 'C', x:0, y:2, foo: 'notbar'}
      ],
      productions: {
        'A': ({part}) => (part.x===1) ? {varter: 'Z', x: 42} : part,
        'B': ({part}) => (part.y===5) ? {varter: 'Z', x: 42} : part,
        'C': ({part}) => (part.foo === 'bar') ? {varter: 'Z'} : part
      }
    });

    custom_para_lsys1.iterate();
    expect(custom_para_lsys1.getString()).to.equal('ZZZC');
  });

  it('Basic (normalized) parametric L-System structure should ge parsed.', function() {
    var para_lsys1 = new lsys.LSystem({
      word: [
        {varter: 'A'},
        {varter: 'B'},
        {varter: 'C', params: [3]},
        {varter: 'D', params: [23, 42, 5]},
        {varter: 'E'},
        {varter: 'F'},
        {varter: 'G', mehh:'foo'}
      ],
      productions: {
        'C': ({index, word, params:[x]}) => (x===3) ? {varter: 'Z'} : {varter: 'C'},
        'D': ({index, word, params:[x, y, z]}) => (y===42) ? {varter: 'Z'} : {varter: 'D'}
      }
    });

    para_lsys1.iterate();
    expect(para_lsys1.getString()).to.equal('ABZZEFG');
  });

  // it('Classic Parametric L-Systems should get parsed properly (strip whitespaces, tokenize into JS objects)', function() {
  //
  //   var classicParamLsys = new lsys.LSystem({
  //     claasicParametricSyntax: true,
  //     word: 'A(1,2)  B(2, 3, 5)',
  //     productions: {
  //       'A(x,y)': (x,y) => `A(${x+1},${y})B(1,1,1)`,
  //       'B(x,y,z)': (x,y,z) => `B(${x*y*z},4,${x+y})B(0,1,1)`
  //     }
  //   })
  //
  //   classicParamLsys.iterate(1)
  //   expect(classicParamLsys.getString()).to.equal('ABZZEFG')
  // })

  // it('Parametric L-Systems should work. (ABOP, p.42)', function() {
  //   var para_lsys2 = new lsys.LSystem({
  //     word: [
  //       {varter: 'B', params: [2]},
  //       {varter: 'A', params: [4, 4]}
  //     ],
  //     productions: [
  //       ['A', ([x, y]) => y<=3 ? {varter: 'A', params: [x*2, x+y]} : 'A'],
  //       ['A', ([x, y]) => y>3 ?
  //         [{varter: 'B', params: [x]},
  //          {varter: 'A', params: [x/y, 0]}]: 'A'],
  //       ['B', ([x]) => x<1 ? {varter: 'C'} : 'B'],
  //       ['B', ([x]) => x>=1 ? {varter: 'B', params: [x-1]} : 'B']
  //     ]
  //   })
  //
  //   para_lsys2.iterate()
  //   expect(para_lsys2.getString()).to.equal('BBA')
  // })

  // it('Parametric L-Systems should work.', function() {
  //   var para_lsys1 = new lsys.LSystem({
  //     word: [
  //       {varter: 'A'},
  //       {varter: 'B'},
  //       {varter: 'C'},
  //       {varter: 'D'},
  //       {varter: 'E'},
  //       {varter: 'F'},
  //       {varter: 'G'}
  //     ],
  //     productions: [
  //       ['C', {varter: 'Z'}]
  //     ]
  //   })
  //
  //   para_lsys1.iterate()
  //   expect(para_lsys1.getString()).to.equal('ABZDEFG')
  // })
  //
  // it('Classic parametric L-Systems should work.', function() {
  //   var para_lsys3 = new lsys.LSystem({
  //     word: '',
  //     productions: [
  //       ['C', {varter: 'Z'}]
  //     ]
  //   })
  //
  //   para_lsys1.iterate()
  //   expect(para_lsys1.getString()).to.equal('ABZDEFG')
  // })

  it('should handle UTF8', function() {
    var test = new lsys.LSystem({
      word:'⚣⚤●',
      productions: {
        '⚣': '♂♂',
        '⚤': '♀♂',
        '●': '○◐◑'
      }
    })
    expect(test.iterate()).to.equal('♂♂♀♂○◐◑')
  })

});
