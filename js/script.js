

// IMPORTANT: change mail server here:
const MAIL = "@dsmz.de"


$('.ui.dropdown').dropdown();
$('.ui.checkbox').checkbox();
$('.ui.accordion').accordion();

$('.ui.form#single')
    .form({
        on: 'blur',
        fields: {
            cores: {
                identifier: 'cores',
                rules: [
                    {
                        type: 'empty',
                        prompt: 'Please define the amount of cores to use (1-16).'
                    },
                    {
                        type: 'integer[1..16]',
                        prompt: 'We have 16 cores on radagast.'
                    }
                ]
            },
            queue: {
                identifier: 'queue',
                rules: [
                    {
                        type: 'empty',
                        prompt: 'You must select a queue.'
                    }
                ]
            },
            memory: {
                identifier: 'memory',
                rules: [
                    {
                        type: 'empty',
                        prompt: 'Please define the amount of RAM to use (1-256 GB).'
                    },
                    {
                        type: 'integer[0..256]',
                        prompt: 'We have 256 GB RAM per node on Frodo.'
                    }
                ]
            },
            mail: {
                identifier: 'mail',
                optional: true,
                rules: [
                    {
                        type: 'regExp[/^[a-z]{3}[0-9]{0,2}$/]',
                        prompt: 'Please enter a valid DSMZ username'
                    }
                ]
            },
            cmd: {
                identifier: 'cmd',
                rules: [
                    {
                        type: 'empty',
                        prompt: 'You must define a command, \'cause your script will do nothing without it.'
                    }
                ]
            },
        },
        onSuccess: function (event) {
            event.preventDefault();
            singleScript($(this))
        }
    })


function objectifyForm(formArray) {
    //serialize data function
    var returnArray = {};
    for (var i = 0; i < formArray.length; i++) {
        returnArray[formArray[i]['name']] = formArray[i]['value'];
    }
    return returnArray;
}

function singleScript(form) {
    console.log(form);
    var param = form.serializeArray()
    param = objectifyForm(param)
    console.log(param);

    var code = ["#!/bin/bash", ""]

    code.push('#SBATCH -p ' + param.queue)
    code.push('#SBATCH -c ' + param.cores)
    code.push('#SBATCH --mem ' + parseInt(param.memory) * 1020)
    if (param.mailtype != 'never' && param.mail.length > 0) {
        code.push('#SBATCH --mail-type ' + param.mailtype.toUpperCase())
        code.push('#SBATCH --mail-user ' + param.mail + MAIL)
    }
    if (param.output.length > 0) {
        code.push('#SBATCH -o ' + param.output)
    }
    if (param.error.length > 0) {
        code.push('#SBATCH -e ' + param.error)
    }
    code.push('')
    code.push('echo "START TIME: " `date`')
    code.push(param.cmd)
    code.push('echo "END TIME: " `date`')

    console.log(code.join("\n"));
    $("#code-single pre code").html(code.join("\n"))

    if (param.input.length > 0) {

        var code = ["#!/bin/bash", ""]

        if (param.groups && param.groups > 0) {
        code.push('i=0')
        }

        code.push('for file in '+ param.input.trim()+'; do')
        code.push('if [ -f "$file" ]; then')
        if (param.skip.length > 0) {
            if (param.asterisk == "full"){
                code.push('    skip=$file')
            } else if (param.asterisk == "basename"){
                code.push('    skip=${file##*/}')
            } else if (param.asterisk == "base"){
                code.push('    skip=${file%.*}')
            } else if (param.asterisk == "without"){
                code.push('    skip=${file%%.*}')
            }
            code.push('    skipfile=' + param.skip.replace("*", "${skip}"))
            code.push('    if [ ! -f "$skipfile" ]; then')
        }
        if (param.groups && param.groups > 0) {
            code.push('    let "i++"')
            code.push('    sbatch --dependency=singleton --job-name=Group$i slurm_script.sh $file')
            code.push('    if (( $i == ' + param.groups + ' )); then')
            if (param.abort && param.abort == "on") {
            code.push('        break')
            }
            code.push('        i=0')
            code.push('    fi')
        } else {
            code.push('    sbatch slurm_script.sh $file')
            if (param.abort && param.abort == "on") {
                code.push('    break')
            }
        }
        if (param.skip.length > 0) {
            code.push('    fi')
        }
        code.push('fi')
        code.push('done')

        console.log(code.join("\n"));
        $("#code-multi").show()
        $("#code-multi pre code").html(code.join("\n"))
        $("#code-caller pre code").html("bash run_slurm.sh")
    } else {
        $("#code-multi").hide()
        $("#code-caller pre code").html("sbatch slurm_script.sh")
    }

    hljs.highlightAll()
}

var defaults = {
    interpro: {
        cores: "3",
        queue: "short",
        memory: "10",
        cmd: "interproscan.sh -cpu 3 -i input_file.faa -f tsv -d output/interpro/ -appl Pfam",
    }
}
