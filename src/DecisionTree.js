import Matrix from '@astuanax/funmatrix'
import { complement } from 'fun.js'
import entropy from './util/entropy'
import Node from './Node'

/**
 * @class DecisionTree
 * @param {Matrix | Array} data
 * @param {Function} evalFunction
 */
class DecisionTree {
  constructor (data, evalFunction = entropy) {
    this.data = Matrix.of(data)
    this.evalFunction = evalFunction
    this.type = 'DecisionTree'
  }
}

/**
 * @memberOf DecisionTree#getColumn
 * @param data
 * @param index
 * @returns {Matrix}
 */
DecisionTree.prototype.getColumn = function (data, index) {
  return data.map(x => x[index])
}

/**
 * @memberOf DecisionTree#split
 * @param data
 * @param m
 * @param n
 * @returns {Matrix[]}
 */
DecisionTree.prototype.split = function (data, m, n) {
  const splittingFunction = (isNaN(m) || isNaN(n))
    ? strRow => strRow[m] === n
    : nrRow => nrRow[m] >= n

  const foldNode = (fn, data) => data.fold((acc, x) => {
    if (fn(x)) {
      acc.push(x)
    }
    return acc
  })

  const left = foldNode(splittingFunction, data)
  const right = foldNode(complement(splittingFunction), data)
  return [left, right]
}

/**
 * @memberOf DecisionTree#train
 * @param {Matrix} data
 * @returns {Node}
 */
DecisionTree.prototype.train = function (data = this.data) {
  if (data.getRows() === 0) {
    return new Node()
  }
  const score = this.evalFunction.func(data) // Matrix

  let bestGain = 0.0
  let bestAttribute = []
  let bestSets = []

  const columnCount = this.data.getCols() - 1 // remove last cell >> dependant value

  for (let i = 0; i < columnCount; ++i) {
    const columnValues = this.getColumn(data, i).__value
    columnValues.forEach((value, idx) => {
      const matrixSplit = this.split(data, i, value)
      const p = matrixSplit[0].getRows() / data.getRows()
      const entropy0 = this.evalFunction.func(matrixSplit[0])
      const entropy1 = this.evalFunction.func(matrixSplit[1])
      const gain = score - (p * entropy0) - ((1 - p) * entropy1)
      if (gain > bestGain && matrixSplit[0].getRows() > 0 && matrixSplit[1].getRows() > 0) {
        bestGain = gain
        bestAttribute = [i, value]
        bestSets = matrixSplit
      }
    })
  }

  if (bestGain > 0) {
    const leftTrained = this.train(bestSets[0])
    const rightTrained = this.train(bestSets[1])
    const _node = new Node(undefined, bestAttribute[0], bestAttribute[1], leftTrained, rightTrained)
    return _node
  } else {
    return new Node(data.__value.map(row => row[row.length - 1]).reduce((acc, val) => {
      acc[val] = acc[val] === undefined ? 1 : acc[val] += 1
      return acc
    }, {}))
  }
}

/**
 * @memberOf DecisionTree#predict
 * @param {Array} observations
 * @param {Node} node
 * @returns {*}
 */
DecisionTree.prototype.predict = function predict (observations, node) {
  if (node.results) {
    return node.results
  }
  const v = observations[node.col]
  const cond = isNaN(v)
    ? (x, y) => x === y // not a number, assuming string
    : (x, y) => x >= y // a number

  let branch = cond(v, node.value)
    ? node.left
    : node.right

  return this.predict(observations, branch)
}

export default DecisionTree
