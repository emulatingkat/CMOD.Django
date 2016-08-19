
$(document).ready(function () {
    var currentTaxa = {
    "Name": OrgName,
    "Taxid": OrgTID,
    "QID": OrgQID,
    "RefSeq": OrgRefSeq
};

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

        },
        cacheDOM: function () {
            this.$of = $("#orgFormModule");
            this.$input = this.$of.find('input');


        },
        acsource: function (orginput) {
            getOrgs(function (orgTags) {
                orginput.autocomplete({
                    minLength: 0,
                    source: orgTags,
                    autoFocus: true,

                    select: function (event, ui) {

                        $('form').each(function () {
                            this.reset()
                        });
                        orginput.val("");
                        $("#geneData, #protData, .main-go-data").html("");

                        currentTaxa = {
                            'Name': ui.item.label,
                            'Taxid': ui.item.taxid,
                            'QID': ui.item.qid,
                            'RefSeq': ui.item.refseq
                        };

                        //initiate gene form with organism data
                        geneForm.init(currentTaxa.Taxid);

                        //render organism data
                        orgData.init(currentTaxa);
                        //launch jbrowse
                        jbrowse.init(
                            currentTaxa.Taxid,
                            currentTaxa.RefSeq,
                            ":100000..200000&tracks=genes_canvas_mod",
                            currentTaxa.Name
                        );
                        //if (window.location.pathname == '/CMOD/') {
                        //    console.log(currentTaxa.Name);
                        //    window.location.replace('/CMOD/main_page')
                        //}
                        if (window.location.pathname === '/CMOD/') {
                            location.href = "main_page.html?id=" + currentTaxa.Taxid;

                        }
                        return false;
                    }
                })
                    //custom template for org search box
                    .autocomplete("instance")._renderItem = function (ul, item) {
                    return $("<li>")
                        .append("<div class='main-data' style=\"border-bottom: solid black 1px\"><i><u><strong>" +
                        item.label + "</strong></u></i><br>Taxid: " + item.taxid + "<br>Wikidata: " +
                        item.qid + "</div>")
                        .appendTo(ul);
                };
            });

        }
    };
    orgForm.init();

//////gene selection form module//////
    var geneForm = {
        currentGene: [],
        currentProtein: [],
        init: function (taxid) {
            this.cacheDOM();
            this.geneData(taxid);
        },
        cacheDOM: function () {
            this.$gf = $("#geneFormModule");
            this.$input = this.$gf.find('input');

        },
        geneData: function (taxid) {
            var geneinput = this.$input;
            getGenes(taxid, function (geneTags) {
                geneinput.autocomplete({
                    minLength: 2,
                    source: geneTags,
                    autoFocus: true,
                    select: function (event, ui) {
                        $('form').each(function () {
                            this.reset()
                        });
                        $("#geneData, #protData, .main-go-data").html("");
                        geneinput.val("");

                        this.currentGene = [
                            ui.item.label,
                            ui.item.id,
                            ui.item.gqid,
                            ui.item.locustag,
                            ui.item.genomicstart,
                            ui.item.genomicend
                        ];
                        this.currentProtein = [
                            ui.item.proteinLabel,
                            ui.item.uniprot,
                            ui.item.protein,
                            ui.item.refseqProtein

                        ];

                        //get GO Terms for this gene/protein
                        goData.init(this.currentProtein[1]);

                        //Render the data into the gene and protein boxes
                        geneData.init(this.currentGene);
                        proteinData.init(this.currentProtein);

                        //focus jbrowse on selected gene
                        var gstart = this.currentGene[4] - 400;
                        var gend = this.currentGene[5] - (-400);
                        jbrowse.init(currentTaxa.Taxid, currentTaxa.RefSeq, ":" + gstart + ".." + gend, currentTaxa.Name);
                        return false;
                    }
                })
                    //custom template for gene search box
                    .autocomplete("instance")._renderItem = function (ul, item) {
                    return $("<li>")
                        .append("<div class='main-data' style=\"border-bottom: solid black 1px\"><strong><u>" + item.label +
                        "</u></strong><br>Entrez ID:" + item.id + "<br>Wikidata: " + item.gqid + "</div>")
                        .appendTo(ul);
                };

            })
        }

    };


//////Go form module//////
    var goForm = {
        endpoint: "https://query.wikidata.org/sparql?format=json&query=",
        init: function () {
            this.cacheDOM();
            this.goTermsAC(this.$mfForm);
            this.goTermsAC(this.$bpForm);
            this.goTermsAC(this.$ccForm);

        },
        cacheDOM: function () {
            this.$goTermForm = $(".main-go-form");
            this.$mfForm = this.$goTermForm.find("#molfuncform");
            this.$bpForm = this.$goTermForm.find("#bioprocform");
            this.$ccForm = this.$goTermForm.find("#celcompform");

        },
        goTermsAC: function (form_element) {
            form_element.autocomplete({
                delay: 900,
                autoFocus: true,
                minLength: 3,
                appendTo: null,
                source: function (request, response) {
                    $.ajax({
                        type: "GET",
                        url: goForm.endpoint + ["SELECT DISTINCT ?goTerm ?goTermLabel ?goID WHERE { ?goTerm wdt:P686 ?goID.",
                            "SERVICE wikibase:label { bd:serviceParam wikibase:language \"en\". ?goTerm rdfs:label ?goTermLabel.}",
                            "FILTER(CONTAINS(LCASE(?goTermLabel), \"" + request.term + "\"))}"].join(" "),
                        datatype: 'json',
                        success: function (data) {
                            var data_array = [];
                            var data_hash = {};
                            $.each(data['results']['bindings'], function (key, element) {
                                var wdid = element['goTerm']['value'].split("/");
                                var orgqid = wdid.slice(-1)[0];
                                data_hash = {
                                    'label': element['goTermLabel']['value'],
                                    'value': orgqid,
                                    'id': element['goID']['value'],
                                    'qid': orgqid
                                };
                                data_array.push(data_hash);
                            });
                            response(data_array);
                        }
                    });
                    //console.log(request.term);
                },
                select: function (event, ui) {
                    $('form').each(function () {
                        this.reset()
                    });
                    //console.log(ui.item.id);


                }
            })
                .autocomplete("instance")._renderItem = function (ul, item) {
                return $("<li>")
                    .append("<div class='main-data' style=\"border-bottom: solid black 1px\"><strong><u>" + item.label +
                    "</u></strong><br>Gene Ontology ID:" + item.id + "<br>Wikidata: " + item.qid + "</div>")
                    .appendTo(ul);
            };
        },

    };
    goForm.init();


//////Evidence Code Form Module//////

    var evidenceCodeForm = {
        endpoint: "https://query.wikidata.org/sparql?format=json&query=",
        init: function () {
            this.cacheDOM();
            this.evidenceCodesAC(this.$mfForm);
            this.evidenceCodesAC(this.$bpForm);
            this.evidenceCodesAC(this.$ccForm);

        },
        cacheDOM: function () {
            this.$evidenceForm = $(".main-go-form");
            this.$mfForm = this.$evidenceForm.find("#mfecform");
            this.$bpForm = this.$evidenceForm.find("#bpecform");
            this.$ccForm = this.$evidenceForm.find("#ccecform");

        },
        evidenceCodesAC: function (form_element) {
            form_element.autocomplete({
                delay: 900,
                autoFocus: true,
                minLength: 3,
                appendTo: null,
                source: function (request, response) {
                    $.ajax({
                        type: "GET",
                        url: goForm.endpoint + [
                            "select distinct ?evidence_code ?evidence_codeLabel ?alias where {" +
                            "?evidence_code wdt:P31 wd:Q23173209. " +
                            "?evidence_code skos:altLabel ?alias." +
                            "filter (lang(?alias) = \"en\") " +
                            "SERVICE wikibase:label { bd:serviceParam wikibase:language \"en\" .}",
                            "FILTER(CONTAINS(LCASE(?alias), \"" + request.term + "\"))}"
                        ].join(" "),


                        datatype: 'json',
                        success: function (data) {
                            var data_array = [];
                            var data_hash = {};
                            $.each(data['results']['bindings'], function (key, element) {
                                var wdid = element['evidence_code']['value'].split("/");
                                var evqid = wdid.slice(-1)[0];
                                data_hash = {
                                    'label': element['alias']['value'],
                                    'value': evqid,
                                    'id': element['evidence_codeLabel']['value'],
                                    'qid': evqid

                                };
                                data_array.push(data_hash);
                            });
                            response(data_array);
                        }
                    });
                    //console.log(request.term);
                },
                select: function (event, ui) {
                    $('form').each(function () {
                        this.reset()
                    });

                }
            })
                .autocomplete("instance")._renderItem = function (ul, item) {
                return $("<li>")
                    .append("<div class='main-data' style=\"border-bottom: solid black 1px\"><strong><u>" + item.label +
                    "</u></strong><br>Evidence Code: " + item.id + "<br>Wikidata: " + item.qid + "</div>")
                    .appendTo(ul);
            };
        }
    };
    evidenceCodeForm.init();


//////////////////////////////////////////End form modules//////////////////////////////////////////////////////////////


////////////////////////////////////Begin data rendering modules////////////////////////////////////////////////////////
//////render the organism data in the Organism box//////
    var orgData = {
        init: function (taxData) {
            this.cacheDOM();
            this.render(taxData);

        },
        cacheDOM: function () {
            this.$od = $("#orgDataModule");
            this.$ul = this.$od.find('ul');
            this.$orgD = this.$od.find('#orgData');
            this.$tid = this.$od.find('#taxid');
            this.$qid = this.$od.find('#QID');
            this.$rsid = this.$od.find('#RefSeq');
            //this.templateORG = this.$od.find('#org-template').html();
            //console.log($('#org-template').html());

        },
        render: function (taxData) {

            var data = {
                'organism': taxData,
                'thing': 'thing'
            };
            this.$tid.html("<span><h4>NCBI Taxonomy ID:</h4>" + data['organism']['Taxid'] + "</span>");
            this.$qid.html("<span><h4>Wikidata Item ID</h4>" + data['organism']['QID'] + "</span>");
            this.$rsid.html("<span><h4>NCBI RefSeq ID</h4>" + data['organism']['RefSeq'] + "</span>");

        }
    };
//////render the gene data in Gene box//////
    var geneData = {
        init: function (gene) {
            this.cacheDOM();
            this.render(gene);


        },
        cacheDOM: function () {
            this.$gd = $("#geneDataModule");
            this.$ul = this.$gd.find('ul');
            this.$geneD = this.$gd.find('#geneData');


            this.template = this.$gd.find('#gene-template').html();

        },
        render: function (gene) {
            //console.log(gene);
            var data = {
                'gene': gene
            };


            this.$geneD.html(
                "<div class='main-data'> <h5>Gene Name:    </h5>     " + data.gene[0] + "</div>" +
                "<div class='main-data'> <h5>Entrez ID:    </h5>     " + data.gene[1] + "</div>" +
                "<div class='main-data'> <h5>Wikidata ID:  </h5>   " + data.gene[2] + "</div>" +
                "<div class='main-data'> <h5>Locus Tag:    </h5>     " + data.gene[3] + "</div>" +
                "<div class='main-data'> <h5>Genomic Start:</h5> " + data.gene[4] + "</div>" +
                "<div class='main-data'> <h5>Genomic End:  </h5>   " + data.gene[5] + "</div>"
            );


        }


    };
//////render the protein dat in the Protein box///////
    var proteinData = {
        init: function (protein) {
            this.cacheDOM();
            this.render(protein);

        },
        cacheDOM: function () {
            this.$pd = $("#proteinDataModule");
            this.$ul = this.$pd.find('ul');
            this.$protD = this.$pd.find('#protData');
            this.template = this.$pd.find('#protein-template').html();

        },
        render: function (protein) {
            //console.log(protein);

            var data = {
                'protein': protein
            };


            this.$protD.html(
                "<div class='main-data'><h5>Protein Name: </h5>" + data.protein[0] + "</div>" +
                "<div class='main-data'><h5>UniProt ID:   </h5>" + data.protein[1] + "</div>" +
                "<div class='main-data'><h5>Wikidata ID:  </h5>" + data.protein[2] + "</div>" +
                "<div class='main-data'><h5>RefSeq ID:    </h5>" + data.protein[3] + "</div>"
            );
        }

    };

//////render the gene ontology data in the GO boxes//////
    var goData = {
        init: function (uniprot) {
            this.cacheDOM();
            this.goTermData(uniprot);

        },
        goTermData: function (uniprot) {

            getGOTerms(uniprot, function (goTerms) {
                //console.log(goTerms);
                goData.render(goTerms);
            });

        },
        cacheDOM: function () {
            this.$go = $('#goBoxes');
            this.$mf = this.$go.find('#molfuncdata');
            this.$bp = this.$go.find('#bioprocdata');
            this.$cc = this.$go.find('#celcompdata');

        },
        render: function (goTerms) {
            //console.log(goTerms);
            var mf = this.$mf;
            var bp = this.$bp;
            var cc = this.$cc;
            $.each(goTerms['molecularFunction'], function (key, element) {
                mf.append(goData.goInput(element['goterm_label']['value'], element['goID']['value']));
                //console.log("mf" + element['goterm_label']['value']);
            });
            $.each(goTerms['biologicalProcess'], function (key, element) {
                bp.append(goData.goInput(element['goterm_label']['value'], element['goID']['value']));
                //console.log("bp" + element['goterm_label']['value']);
            });
            $.each(goTerms['cellularComponent'], function (key, element) {
                cc.append(goData.goInput(element['goterm_label']['value'], element['goID']['value']));
                //console.log("cc" + element['goterm_label']['value']);
            });

        },
        goInput: function (golable, goid) {
            return "<div class=\"row main-dataul\"><div class=\"col-md-8\"><h5>" +
                golable + "</h5></div>" +
                "<div class=\"col-md-4\">" +
                "<a target=\"_blank\" href=http://amigo.geneontology.org/amigo/term/" + goid + "><h5>" +
                goid + "</h5></a>" +
                "</div></div>";
        }
    };
///////////////////////////////////////End data rendering modules///////////////////////////////////////////////////////


//////////////////////////////////////////Begin JBrowse Module//////////////////////////////////////////////////////////

    var jbrowse = {

        init: function (taxid, refseq, coords, name) {
            this.cacheDOM();
            this.render(taxid, refseq, coords, name);

        },
        url: "../../static/cmod_main/JBrowse-1.12.1-dev/index.html?data=sparql_data/sparql_data_",
        coordPrefix: "&tracklist=0&menu=0&loc=",
        cacheDOM: function () {
            this.$jb = $("#jbrowseModule");
            this.$browser = this.$jb.find('#jbrowse');
            this.$orgTitle = this.$jb.find('#main-organism-name');
            this.$name = this.$orgTitle.find('i');

            this.templateJB = this.$jb.find('#jbrowse-template').html();


        },
        render: function (taxid, refseq, coords, name) {
            var data = {
                'url': this.url + taxid + this.coordPrefix + refseq + coords,
                'name': name
            };
            this.$browser.html("<iframe src=\"" + data.url + "\"><iframe>");
            this.$name.html(name);
            console.log(data.url);


        }


    };
/////////////////////////////////////////////////End Jbrowse module/////////////////////////////////////////////////////


    var djangoServer = {
        init: function(data, urlsuf){
            this.sendToServer(data, urlsuf)

        },
        sendToServer: function (data, urlsuf) {
            var csrftoken = this.getCookie('csrftoken');
            $.ajax({
                type: "POST",
                url: window.location.pathname + 'urlsuf',
                data: data,
                dataType: 'json',
                headers: {'X-CSRFToken': csrftoken},
                success: function (data) {
                    console.log("success");
                    console.log(data);
                    window.location.href = "main_page";

                },
                error: function (data) {
                    console.log("error");
                    console.log(data);
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
        }
    };




/////////////////////////////////////////////////Begin Wikidata API/////////////////////////////////////////////////////


//var WDAPI = {
//    init: function (user, password) {
//        this.server = "www.wikidata.org";
//        this.user = user;
//        this.password = password;
//        this.edit_token = '';
//        this.token_renew_period = 1800;
//        this.getEditCredentials();
//    },
//    getEditCredentials: function () {
//        //$.ajax({
//        //    url: 'https://www.wikidata.org/w/api.php',
//        //    //    type: 'POST',
//        //    //    data: {
//        //    //        action: 'query',
//        //    //        format: 'json',
//        //    //        meta: "tokens",
//        //    //        type: "login"
//        //    //    },
//        //    data: {
//        //        action: 'query',
//        //        meta: 'tokens',
//        //        format: 'json',
//        //        type: 'login'
//        //
//        //        //origin: 'https://www.mediawiki.org'
//        //    },
//        //    xhrFields: {
//        //        withCredentials: true
//        //    },
//        //    dataType: 'jsonp' // will probably use 'json' now that I'm server-side
//        //}).done(function (data) {
//        //    console.log(data);
//        //});
////'https://www.wikidata.org/w/api.php?action=query&meta=tokens&type=login&format=json'
//    $.ajax({
//        url: 'https://www.wikidata.org/w/api.php',
//        type: 'POST',
//        data: {
//            action: 'query',
//            format: 'json',
//            meta: "tokens",
//            type: "login"
//        },
//        xhrFields: {
//            withCredentials: true
//        },
//        dataType: 'json',
//        success: function (data) {
//            //console.log(data);
//            console.log("Its good");
//            // will probably use 'json' now that I'm server-side
//        },
//        error: function(){
//
//        }
//    });
//    //
//    ////api.php?action=clientlogin&username=Example&password=ExamplePassword&loginreturnurl=http://example.org/&logintoken=123ABC
//    //$.ajax({
//    //    url: "https://en.wikipedia.org/w/api.php",
//    //    type: "POST",
//    //    jsonp: "callback",
//    //    dataType: 'jsonp',
//    //    data: {
//    //        action: "login",
//    //        lgname: "MicrobeBot",
//    //        lgpassword: "tK4CdCQv4IeU",
//    //        format: "json"
//    //    },
//    //    xhrFields: {withCredentials: true},
//    //    success: function(data,success,xhr){
//    //        console.log(data);
//    //        console.log("ok good");
//    //        console.log(xhr.url);
//    //    }
//    //
//    //});
//    //$.ajax({
//    //    type: "POST",
//    //    url: this.url,
//    //    datatype: 'json',
//    //    success: function (data, status, xhr) {
//    //        console.log(xhr);
//    //    }
//    //
//    //});
//    }
//
//
//};
//
//WDAPI.init("MicrobeBot", "tK4CdCQv4IeU");


/////////////////////////////////////////////////End Wikidata API///////////////////////////////////////////////////////


////////////////////////////////////////////////////Begin preload///////////////////////////////////////////////////////
    jbrowse.init(currentTaxa['Taxid'], currentTaxa['RefSeq'], ':100000..200000&tracks=genes_canvas_mod', currentTaxa['Name']);
    orgData.init(currentTaxa);
    geneForm.init(currentTaxa['Taxid']);
    //geneData.init([
    //    '2-oxoglutarate dehydrogenase complex subunit dihydrolipoyllysine-residue succinyltransferase CTL0311',
    //    '5858187',
    //    'http://www.wikidata.org/entity/Q21168910',
    //    'CTL0311',
    //    '385948',
    //    '387045'
    //]);
    //
    //proteinData.init([
    //    '2-oxoglutarate dehydrogenase complex subunit dihydrolipoyllysine-residue succinyltransferase CTL0311',
    //    'A0A0H3MBK1',
    //    'http://www.wikidata.org/entity/Q21172795',
    //    'YP_001654394'
    //]);
    //goData.init('A0A0H3MBK1');
//////////////////////////////////////////////////////End data preload//////////////////////////////////////////////////
});

