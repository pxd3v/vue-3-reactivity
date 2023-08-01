let activeEffect

const effectSubscriptions = new WeakMap()

function getSubscribersForProperty(target, key) {
    let targetSubscribers = effectSubscriptions.get(target)

    if(!targetSubscribers) {
        effectSubscriptions.set(target, new Map())
        targetSubscribers = effectSubscriptions.get(target)
        targetSubscribers.set(key, new Set())
        return targetSubscribers.get(key)
    }

    let keySubscribers = targetSubscribers.get(key)

    if (!keySubscribers) {
        targetSubscribers.set(key, new Set())
        return targetSubscribers.get(key)
    }

    return keySubscribers
}

function track (target, key) {
    if (activeEffect) {
        const effects = getSubscribersForProperty(target, key)
        effects.add(activeEffect)
    }
}

function trigger (target, key) {
    const effects = getSubscribersForProperty(target, key)
    effects.forEach((effect) => effect())
}

// set function as activeEffect, then call it
// this will add this function as subscriber to all properties that are tracked while this function is running
// then set activeEffect to null so it doesn't affect other properties track
function watchEffect(fn) {
    activeEffect = fn
    if (activeEffect) activeEffect()
    activeEffect = null
}

function createReactive(target) {
    return new Proxy(target, {
        get(target, key) {
            const result = Reflect.get(target, key)
            track(target, key)
            return result
        },
        set(target, key, value) {
            const result = Reflect.set(target, key, value)
            trigger(target, key)
            return result
        }
    })
}


function createRef(value) {
    const refObject = {
      get value() {
        track(refObject, 'value')
        return value
      },
      set value(newValue) {
        value = newValue
        trigger(refObject, 'value')
      }
    }

    return refObject
}

function createComputed(fn) {
    const temp = createRef(fn())
    
    watchEffect(() => {
        temp.value = fn()
    })

    return temp
}

let a = createReactive({ value: 1 })
let b = createRef(2)
let sum = createComputed(() => a.value + b.value)

watchEffect(() => {
    console.log('value:', b.value)
})

b.value = 4
