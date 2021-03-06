var currentTaxa = {};
$(document).ready(function () {
//////////////////////////////////////////Begin Global variables////////////////////////////////////////////////////////
//
//    var currentTaxa = {
//        'Name': 'Chlamydia trachomatis 434/BU',
//        'Taxid': '471472',
//        'QID': 'Q20800254',
//        'RefSeq': 'NC_010287.1'
//    };
///////////////////////////////////////////End Global Variables/////////////////////////////////////////////////////////
///////////////////////////////////////////Begin form modules///////////////////////////////////////////////////////////
//////organism selection form module//////
    var orgForm = {

        init: function () {
            this.cacheDOM();
            this.acsource(this.$input);
            this.loadExample();

        },
        cacheDOM: function () {
            this.$of = $("#indexFormModule");
            this.$input = this.$of.find('input');
        },
        acsource: function (orginput) {
            getOrgs(function (orgTags) {
                orginput.autocomplete({
                    minLength: 3,
                    source: orgTags,
                    autoFocus: true,

                    select: function (event, ui) {
                        console.log(window.location.pathname);

                        $('form').each(function () {
                            this.reset()
                        });
                        orginput.val("");
                        $("#geneData, #protData, .main-go-data").html("");

                        currentTaxa = {
                            "Name": ui.item.name,
                            "Taxid": ui.item.taxid,
                            "QID": ui.item.qid,
                            "RefSeq": ui.item.refseq
                        };
                        orgForm.sendToServer(currentTaxa);
                        console.log(window.location.pathname);
                        return false;
                    }
                })
                    //custom template for org search box
                    .autocomplete("instance")._renderItem = function (ul, item) {
                    return $("<li>")
                        .append("<div class='main-data' style=\"border-bottom: solid black 1px\"><i><u><strong>" +
                        item.name + "</strong></u></i><br>Taxid: " + item.taxid + "<br>Wikidata: " +
                        item.qid + "</div>")
                        .appendTo(ul);
                };

            });
        },
        sendToServer: function (data) {
            var csrftoken = this.getCookie('csrftoken');

            $.ajax({
                type: "POST",
                url: window.location.pathname + 'get_orgs', // + 'orginput',
                data: data,
                dataType: 'json',
                headers: {'X-CSRFToken': csrftoken},
                success: function (data) {
                    console.log("success");
                    console.log(data);
                    window.location.href = "main_page";
                    console.log(window.location.href);

                },
                error: function (data) {
                    console.log("error");
                    console.log(data);
                    console.log(window.location.pathname);
                }
            });
        },
        getCookie: function (name) {
            var cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                var cookies = document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = jQuery.trim(cookies[i]);
                    // Does this cookie string begin with the name we want?
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        },
        loadExample: function () {

            var hpylori = {
                "Name": "Helicobacter pylori 26695",
                "Taxid": "85962",
                "QID": "Q21065231",
                "RefSeq": "NC_000915.1"
            };
            $('#loadHpylori').off("click").click(function (e) {
                e.preventDefault();
                console.log("Load Example");

                orgForm.sendToServer(hpylori);
                console.log(window.location.pathname);

            });
        }


    };
    orgForm.init();
});
