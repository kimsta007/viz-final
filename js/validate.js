    function onInputAll() {
        console.log($('#total-baseline').val())
        if ($('#total-baseline').val().length >= 1) {
            disableButtons(false, false, false)
        } else { disableButtons(true, true, true) }
    }

    function onInputBaseline() {
        let baselineIcu = parseInt($('#baseline-icu').val()), baselineNicu = parseInt($('#baseline-nicu').val()),
            baseline = parseInt($('#total-baseline').val())
        if ((baselineIcu + baselineIcu) > baseline) {
            alert("The # of ICU & nonICU Beds should not exceed the total baseline " + baseline)
            disableButtons(true, true, true)
        }else {disableButtons(false, false, false)}
    }

    function onInputOccupied() {
        let occupiedIcu = parseInt($('#occupied-icu').val()),
            occupiedNicu = parseInt($('#occupied-nicu').val()),
            baselineIcu = parseInt($('#baseline-icu').val()), baselineNicu = parseInt($('#baseline-nicu').val())
        if ((occupiedIcu > baselineIcu) || (occupiedNicu > baselineNicu)) {
            alert("occupied beds should be less than the its available type (" + baselineIcu + " or " + baselineNicu + ")")
            disableButtons(true, true, true)
        } else {disableButtons(false, false, false)}
    }

    function onInputSurge() {
        let unsuitable = parseInt($('#total-unsuitable').val()),
            surgeAlt = parseInt($('#surge-alt').val()), surgeIcu = parseInt($('#surge-icu').val()),
            surgeNicu = parseInt($('#surge-nicu').val())
        if ((surgeAlt + surgeIcu + surgeNicu > unsuitable) || (surgeAlt > unsuitable) || (surgeIcu > unsuitable) || (surgeNicu > unsuitable)) {
            alert("Total surge beds can't be greater than # unsuitable beds (" + unsuitable + ")")
            disableButtons(true, true, true)
        }else {disableButtons(false, false, false)}
    }

    function disableButtons(btn1, btn2, btn3) {
        $('#btn-availability').prop('disabled', btn1)
        $('#btn-type').prop('disabled', btn2)
        $('#btn-arrange').prop('disabled', btn3)
    }
