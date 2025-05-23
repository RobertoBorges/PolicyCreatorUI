var editor = null;

function createEditor() {
    var container = document.getElementById("drawflow");
    editor = new Drawflow(container);
    editor.start();
}

function createDraggableNode(containerSelector, nodeInfo, displayText) {
    var div = $("<div></div>")
        .addClass("draggable-node")
        .css({ "border": "1px solid #ccc", "padding": "5px", "margin": "5px", "cursor": "move", "background": "#f5f5f5" })
        .attr("draggable", "true")
        .attr("data-node", JSON.stringify(nodeInfo));
    div.append("<strong>" + displayText + "</strong>");
    $(containerSelector).append(div);
}

function loadLogicalNodes() {
    var logicalItems = ["not", "allOf", "anyOf"];
    logicalItems.forEach(function (item) {
        var nodeInfo = { type: "LogicalOperator", data: { operator: item, type: "LogicalOperator" }, name: item };
        createDraggableNode("#logical-nodes", nodeInfo, item);
    });
}

function loadFieldsNodes() {
    var fieldOptions = [
        { value: "name", text: "name" },
        { value: "fullName", text: "fullName" },
        { value: "kind", text: "kind" },
        { value: "type", text: "type" },
        { value: "location", text: "location" },
        { value: "id", text: "id" },
        { value: "identity.type", text: "identity.type" },
        { value: "tags", text: "tags" }
    ];
    $("#fields-nodes").empty();
    fieldOptions.forEach(function (option) {
        var nodeInfo = { type: "Field", data: { resource: option.value, type: "Field" }, name: option.text };
        createDraggableNode("#fields-nodes", nodeInfo, option.text);
    });
    setupDraggableNodes();
}

function loadConditionsNodes() {
    var conditionsItems = [
        { name: "equals", accepted: "string" },
        { name: "notEquals", accepted: "string" },
        { name: "like", accepted: "string" },
        { name: "notLike", accepted: "string" },
        { name: "match", accepted: "string" },
        { name: "matchInsensitively", accepted: "string" },
        { name: "notMatch", accepted: "string" },
        { name: "notMatchInsensitively", accepted: "string" },
        { name: "contains", accepted: "string" },
        { name: "notContains", accepted: "string" },
        { name: "in", accepted: "array" },
        { name: "notIn", accepted: "array" },
        { name: "containsKey", accepted: "key" },
        { name: "notContainsKey", accepted: "key" },
        { name: "less", accepted: "number|date|string" },
        { name: "lessOrEquals", accepted: "number|date|string" },
        { name: "greater", accepted: "number|date|string" },
        { name: "greaterOrEquals", accepted: "number|date|string" },
        { name: "exists", accepted: "bool" }
    ];
    conditionsItems.forEach(function (item) {
        var nodeInfo = { type: "Condition", data: { condition: item.name, accepted: item.accepted, type: "Condition" }, name: item.name };
        createDraggableNode("#conditions-nodes", nodeInfo, item.name);
    });
    setupDraggableNodes();
}

function loadEffectNodes() {
    var effectItems = [
        "addToNetworkGroup", "append", "audit", "auditIfNotExists",
        "deny", "denyAction", "deployIfNotExists", "disabled",
        "manual", "modify", "mutate"
    ];
    effectItems.forEach(function (item) {
        var nodeInfo = { type: "Effect", data: { effect: item, type: "Effect" }, name: item };
        createDraggableNode("#effect-nodes", nodeInfo, item);
    });
}

function setupDraggableNodes() {
    $(".draggable-node").off("dragstart").on("dragstart", function (e) {
        e.originalEvent.dataTransfer.setData("text/plain", $(this).attr("data-node"));
    });
}

function setupEditorDrop() {
    var container = document.getElementById("drawflow");
    container.addEventListener("dragover", function (e) {
        e.preventDefault();
    });
    container.addEventListener("drop", function (e) {
        e.preventDefault();
        var nodeData = e.dataTransfer.getData("text/plain");
        if (nodeData) {
            var nodeInfo = JSON.parse(nodeData);
            var rect = container.getBoundingClientRect();
            var pos_x = e.clientX - rect.left;
            var pos_y = e.clientY - rect.top;
            nodeInfo.data.type = nodeInfo.type;
            var customClass = "";
            if (nodeInfo.data.type === "Field") {
                customClass = nodeInfo.name.toLowerCase() + " field-node";
            } else if (nodeInfo.data.type === "Condition") {
                customClass = nodeInfo.name.toLowerCase() + " condition-node";
            } else if (nodeInfo.data.type === "LogicalOperator") {
                customClass = nodeInfo.name.toLowerCase() + " logical-node";
            } else if (nodeInfo.data.type === "Effect") {
                customClass = nodeInfo.name.toLowerCase() + " effect-node";
            } else {
                customClass = nodeInfo.name.toLowerCase();
            }
            var content = "";
            if (nodeInfo.type === "Condition") {
                content += "<div><strong>" + nodeInfo.name + "</strong><br/>";
                var accepted = nodeInfo.data.accepted.toString().trim().toLowerCase();
                if (accepted === "bool" || accepted === "boolean") {
                    content += '<select class="condition-input form-control form-control-sm" style="margin-top:5px;">' +
                        '<option value="YES">YES</option>' +
                        '<option value="NO">NO</option>' +
                        '</select>';
                } else {
                    content += '<input type="text" class="condition-input form-control form-control-sm" style="margin-top:5px;" placeholder="' + nodeInfo.data.accepted + '" />';
                }
                content += "</div>";
                editor.addNode(nodeInfo.name, 1, 1, pos_x, pos_y, customClass, nodeInfo.data, content, false);
            } else if (nodeInfo.type === "Field") {
                if (nodeInfo.data.resource === "type") {
                    getTypeAliases(function (aliases) {
                        var content = "<div><strong>" + nodeInfo.name + "</strong><br/>";
                        content += '<select class="field-select form-control form-control-sm" style="margin-top:5px;">';
                        aliases.forEach(function (opt) {
                            content += '<option value="' + opt.value + '">' + opt.text + '</option>';
                        });
                        content += '</select></div>';
                        nodeInfo.data.aliases = aliases[0].value;
                        editor.addNode(nodeInfo.name, 1, 1, pos_x, pos_y, nodeInfo.name, nodeInfo.data, content, false);
                    });
                } else {
                    content = "<div><strong>" + nodeInfo.name + "</strong></div>";
                    editor.addNode(nodeInfo.name, 1, 1, pos_x, pos_y, nodeInfo.name, nodeInfo.data, content, false);
                }
            } else if (nodeInfo.type === "Effect") {
                var hasEffect = false;
                var nodes = editor.drawflow.drawflow.Home.data;
                for (var id in nodes) {
                    if (nodes[id].data.type === "Effect") {
                        hasEffect = true;
                        break;
                    }
                }
                if (hasEffect) {
                    showToast("Only one effect is allowed. Please delete the existing effect before adding a new one.");
                    return;
                } else if (nodeInfo.type === "Effect" && nodeInfo.name.toLowerCase() != "deployifnotexists") {
                    content = "<div><strong>" + nodeInfo.name + "</strong></div>";
                    editor.addNode(nodeInfo.name, 1, 0, pos_x, pos_y, customClass, nodeInfo.data, content, false);
                } else {
                    content = "<div><strong>" + nodeInfo.name + "</strong></div>";
                    editor.addNode(nodeInfo.name, 1, 1, pos_x, pos_y, customClass, nodeInfo.data, content, false);
                }
            } else {
                content = "<div><strong>" + nodeInfo.name + "</strong></div>";
                editor.addNode(nodeInfo.name, 1, 1, pos_x, pos_y, customClass, nodeInfo.data, content, false);
            }
        }
    });
}

function loadExampleNodes() {
    var node1 = editor.addNode("not", 1, 1, 50, 50, "not logical-node", { operator: "not", type: "LogicalOperator" }, "<div><strong>not</strong></div>", false);
    var node2 = editor.addNode("location", 1, 1, 250, 50, "Resource field-node", { resource: "location", type: "Field" }, "<div><strong>location</strong></div>", false);
    var node3 = editor.addNode("equals", 1, 1, 450, 50, "equals condition-node", { condition: "equals", accepted: "string", value: "global", type: "Condition" }, "<div><strong>equals</strong><br/><input type='text' value='global' class='condition-input form-control form-control-sm' style='margin-top:5px;' /></div>", false);
    var node4 = editor.addNode("deny", 1, 0, 650, 50, "deny effect-node", { effect: "deny", type: "Effect" }, "<div><strong>deny</strong></div>", false);
    editor.addConnection(1, 2, 'output_1', 'input_1');
    editor.addConnection(2, 3, 'output_1', 'input_1');
    editor.addConnection(3, 4, 'output_1', 'input_1');
}

$(document).on('keyup change', 'input.condition-input', function () {
    var nodeEl = $(this).closest('.drawflow-node');
    var nodeId = nodeEl.attr('id').replace('node-', '');
    if (nodeId && editor.drawflow && editor.drawflow.drawflow.Home && editor.drawflow.drawflow.Home.data[nodeId]) {
        editor.drawflow.drawflow.Home.data[nodeId].data.value = $(this).val();
    }
});

function traceChain(nodeId, nodes) {
    var chain = [];
    var current = nodes[nodeId];
    chain.unshift(nodeId);
    while (true) {
        var found = false;
        for (var input in current.inputs) {
            var conns = current.inputs[input].connections;
            if (conns && conns.length > 0) {
                var prevId = conns[0].node;
                chain.unshift(prevId);
                current = nodes[prevId];
                found = true;
                break;
            }
        }
        if (!found) break;
    }
    return chain;
}

function getChainsForEffect(effectId) {
    var flow = editor.export();
    var nodes = flow.drawflow.Home.data;
    var chains = [];
    var effectNode = nodes[effectId];
    for (var input in effectNode.inputs) {
        var conns = effectNode.inputs[input].connections;
        if (conns && conns.length > 0) {
            conns.forEach(function (conn) {
                var chain = traceChain(conn.node, nodes);
                chain.push(effectId);
                chains.push(chain);
            });
        }
    }
    return chains;
}

function buildConditionFromChain(chain, nodes) {
    for (var i in chain) {
        var node = nodes[chain[i]];
    }
    var firstNode = nodes[chain[0]];
    var cond = { field: "" };
    if (firstNode.data.type === "LogicalOperator") {
        var fieldNode = nodes[chain[1]];
        var conditionNode = nodes[chain[2]];
        cond.field = fieldNode.data.resource;
        cond[conditionNode.data.condition] = conditionNode.data.value || "value";
        var result = {};
        result[firstNode.data.operator] = cond;
        return result;
    } else {
        var fieldNode = nodes[chain[0]];
        var conditionNode = nodes[chain[1]];
        cond.field = fieldNode.data.resource;
        cond[conditionNode.data.condition] = conditionNode.data.value || "value";
        return cond;
    }
}

function validatePolicy(chains, nodes) {
    if (chains.length < 1) return "Policy must have at least one valid flow";
    for (var i = 0; i < chains.length; i++) {
        var chain = chains[i];
        var numField = 0, numCondition = 0, numEffect = 0;
        for (var j = 0; j < chain.length; j++) {
            var node = nodes[chain[j]];
            if (node.data.type === "Field") numField++;
            else if (node.data.type === "Condition") numCondition++;
            else if (node.data.type === "Effect") numEffect++;
        }
        if (numField < 1) return "Each flow must have at least one field";
        if (numCondition < 1) return "Each flow must have at least one condition";
        if (numEffect !== 1) return "Each flow must have exactly one effect";
        for (var j = 0; j < chain.length - 1; j++) {
            var current = nodes[chain[j]];
            var next = nodes[chain[j + 1]];
            if (current.data.type === "Field" && next.data.type !== "Condition") {
                return "Each field must be immediately followed by a condition in each flow";
            }
        }
    }
    return null;
}

function generatePolicy() {
    var flow = editor.export();
    var nodes = flow.drawflow.Home.data;

    for (var id in nodes) {
        if (nodes[id].data.type === "Condition") {
            var nodeEl = document.getElementById("node-" + id);
            if (nodeEl) {
                var inputEl = nodeEl.querySelector("input.condition-input");
                if (!inputEl) {
                    inputEl = nodeEl.querySelector("select.condition-input");
                }
                nodes[id].data.value = inputEl ? inputEl.value : "";
            } else {
                nodes[id].data.value = "";
            }
        }
    }

    var effectId = null;
    for (var id in nodes) {
        if (nodes[id].data.type === "Effect") {
            effectId = id;
            break;
        }
    }
    if (!effectId) {
        alert("No effect node found");
        return;
    }

    var chains = getChainsForEffect(effectId);
    var validationError = validatePolicy(chains, nodes);
    if (validationError) {
        alert(validationError);
        return;
    }

    var conditions = [];
    for (var i = 0; i < chains.length; i++) {
        var chain = chains[i];
        var chainWithoutEffect = chain.slice(0, chain.length - 1);
        var condition = buildConditionFromChain(chainWithoutEffect, nodes);
        conditions.push(condition);
    }
    var ifClause = (conditions.length === 1) ? conditions[0] : { allOf: conditions };

    var effectNode = nodes[effectId];

    var policy = {
        mode: "All",
        policyRule: {
            if: ifClause,
            then: { effect: effectNode.data.effect }
        }
    };

    document.getElementById("policyOutput").textContent = JSON.stringify(policy, null, 4);
}

function setupConnectionEvents() {
    editor.on('connectionCreated', function (connectionData) {
        var fromNodeId = connectionData.output_id;
        var toNodeId = connectionData.input_id;
        var nodes = editor.drawflow.drawflow.Home.data;
        var fromNode = nodes[fromNodeId];
        var toNode = nodes[toNodeId];

        //Checking Field Types to Condition
        if (fromNode && toNode &&
            fromNode.data.type === "Field" &&
            fromNode.data.resource === "type" &&
            toNode.data.type === "Condition") {

            var alias = fromNode.data.aliases;

            getResourceTypesForAlias(alias, function (resourceTypes) {
                var dropdown = '<select class="condition-input form-control form-control-sm" style="margin-top:5px;">';
                resourceTypes.forEach(function (rt) {
                    dropdown += '<option value="' + rt.value + '">' + rt.text + '</option>';
                });
                dropdown += '</select>';

                var newContent = "<div><strong>" + toNode.name + "</strong><br/>" + dropdown + "</div>";

                var nodeEl = document.getElementById("node-" + toNodeId);
                if (nodeEl) {
                    var contentEl = nodeEl.querySelector('.drawflow_content_node');
                    if (contentEl) {
                        contentEl.innerHTML = newContent;
                    } else {
                        nodeEl.innerHTML = newContent;
                    }
                }
                toNode.data.useResourceTypeDropdown = true;
            });
        }

        //Checking Location Field to Condition
        if (fromNode && toNode &&
            fromNode.data.type === "Field" &&
            fromNode.data.resource === "location" &&
            toNode.data.type === "Condition") {

            var locations = getLocationOptions();
            var dropdown = '<select class="condition-input form-control form-control-sm" style="margin-top:5px;">';
            locations.forEach(function (loc) {
                dropdown += '<option value="' + loc.value + '">' + loc.text + '</option>';
            });
            dropdown += '</select>';

            var newContent = "<div><strong>" + toNode.name + "</strong><br/>" + dropdown + "</div>";

            var nodeEl = document.getElementById("node-" + toNodeId);
            if (nodeEl) {
                var contentEl = nodeEl.querySelector('.drawflow_content_node');
                if (contentEl) {
                    contentEl.innerHTML = newContent;
                } else {
                    nodeEl.innerHTML = newContent;
                }
            }
        }

        //not verificator
        var node = editor.drawflow.drawflow.Home.data[fromNodeId];
        if (node && node.data.type === "LogicalOperator" && node.data.operator.toLowerCase() === "not") {
            var connections = node.outputs["output_1"].connections;
            if (connections.length > 1) {
                editor.removeSingleConnection(connectionData.output_id, connectionData.input_id, 'output_1', 'input_1');
                showToast("A NOT logical operator can only have one output connection.");
            }
        }
    });

    editor.on('connectionRemoved', function (connectionData) {
        var fromNodeId = connectionData.output_id;
        var toNodeId = connectionData.input_id;
        var nodes = editor.drawflow.drawflow.Home.data;
        var fromNode = nodes[fromNodeId];
        var toNode = nodes[toNodeId];

        if (fromNode && toNode &&
            fromNode.data.type === "Field" &&
            fromNode.data.resource === "type" ||
            fromNode.data.resource === "location" &&
            toNode.data.type === "Condition") {

            var defaultContent = "<div><strong>" + toNode.name + "</strong><br/>" +
                '<input type="text" class="condition-input form-control form-control-sm" style="margin-top:5px;" placeholder="' + toNode.data.accepted + '" />' +
                "</div>";

            var nodeEl = document.getElementById("node-" + toNodeId);
            if (nodeEl) {
                var contentEl = nodeEl.querySelector('.drawflow_content_node');
                if (contentEl) {
                    contentEl.innerHTML = defaultContent;
                } else {
                    nodeEl.innerHTML = defaultContent;
                }
            }
        }
    });
}

var cachedAliases = null;

function getTypeAliases(callback) {
    if (cachedAliases) {
        callback(cachedAliases);
        return;
    }
    $.ajax({
        url: "https://policyalias.mats.codes/",
        dataType: "html",
        success: function (data) {
            var parsedHTML = $.parseHTML(data);
            var aliases = [];
            if (parsedHTML) {
                $(parsedHTML).find("nav ul li a").each(function () {
                    var aliasText = $(this).text().trim();
                    if (aliasText) {
                        aliases.push({ value: aliasText, text: aliasText });
                    }
                });
            }
            if (!aliases.length) {
                aliases = [
                    { value: "Microsoft.App", text: "Microsoft.App" },
                    { value: "Microsoft.AppConfiguration", text: "Microsoft.AppConfiguration" }
                ];
            }
            // Store the result in the cache
            cachedAliases = aliases;
            callback(aliases);
        },
        error: function () {
            cachedAliases = [
                { value: "Microsoft.App", text: "Microsoft.App" },
                { value: "Microsoft.AppConfiguration", text: "Microsoft.AppConfiguration" }
            ];
            callback(cachedAliases);
        }
    });
}

function getResourceTypesForAlias(alias, callback) {
    $.ajax({
        url: "https://policyalias.mats.codes/" + alias + "/",
        dataType: "html",
        success: function (data) {
            var parsedHTML = $.parseHTML(data);
            var resourceTypes = [];
            var metaDesc = $(parsedHTML).filter('meta[name="description"]').attr("content") || $(parsedHTML).find('meta[name="description"]').attr("content");
            if (metaDesc) {
                var parts = metaDesc.split("Resource Types");
                if (parts.length > 1) {
                    var rtString = parts[1].trim();
                    var rtArray = rtString.split(/\s+/);
                    resourceTypes = rtArray.map(function (rt) {
                        return { value: rt, text: rt };
                    });
                }
            }
            if (alias.toLowerCase() === "microsoft.aad") {
                resourceTypes = resourceTypes.filter(function (item) {
                    return item.value === "Microsoft.AAD/DomainServices";
                });
            }
            if (!resourceTypes.length) {
                resourceTypes = [
                    { value: "Microsoft.Network/publicIPAddresses", text: "Microsoft.Network/publicIPAddresses" },
                    { value: "Microsoft.Compute/virtualMachines", text: "Microsoft.Compute/virtualMachines" }
                ];
            }
            callback(resourceTypes);
        },
        error: function () {
            callback([
                { value: "Microsoft.Network/publicIPAddresses", text: "Microsoft.Network/publicIPAddresses" },
                { value: "Microsoft.Compute/virtualMachines", text: "Microsoft.Compute/virtualMachines" }
            ]);
        }
    });
}

function setupFieldSelectEvents() {
    $(document).on('change', 'select.field-select', function () {
        var nodeEl = $(this).closest('.drawflow-node');
        var nodeId = nodeEl.attr('id').replace('node-', '');
        if (nodeId && editor.drawflow.drawflow.Home.data[nodeId]) {
            var newAlias = $(this).val();
            editor.drawflow.drawflow.Home.data[nodeId].data.aliases = newAlias;

            var fieldNode = editor.drawflow.drawflow.Home.data[nodeId];
            if (fieldNode.outputs && fieldNode.outputs["output_1"]) {
                var conns = fieldNode.outputs["output_1"].connections;
                conns.forEach(function (conn) {
                    var toNodeId = conn.node;
                    var toNode = editor.drawflow.drawflow.Home.data[toNodeId];
                    if (toNode && toNode.data.type === "Condition") {
                        getResourceTypesForAlias(newAlias, function (resourceTypes) {
                            var dropdown = '<select class="condition-input form-control form-control-sm" style="margin-top:5px;">';
                            resourceTypes.forEach(function (rt) {
                                dropdown += '<option value="' + rt.value + '">' + rt.text + '</option>';
                            });
                            dropdown += '</select>';
                            var newContent = "<div><strong>" + toNode.name + "</strong><br/>" + dropdown + "</div>";

                            var condNodeEl = document.getElementById("node-" + toNodeId);
                            if (condNodeEl) {
                                var contentEl = condNodeEl.querySelector('.drawflow_content_node');
                                if (contentEl) {
                                    contentEl.innerHTML = newContent;
                                } else {
                                    condNodeEl.innerHTML = newContent;
                                }
                            }
                        });
                    }
                });
            }
        }
    });
}

function showToast(message) {
    var toastEl = document.createElement("div");
    toastEl.className = "toast align-items-center text-white bg-danger border-0";
    toastEl.setAttribute("role", "alert");
    toastEl.setAttribute("aria-live", "assertive");
    toastEl.setAttribute("aria-atomic", "true");
    toastEl.style.position = "fixed";
    toastEl.style.bottom = "20px";
    toastEl.style.right = "20px";
    toastEl.innerHTML = '<div class="d-flex">' +
        '<div class="toast-body">' + message + '</div>' +
        '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>' +
        '</div>';
    document.body.appendChild(toastEl);
    var toast = new bootstrap.Toast(toastEl, { delay: 5000 });
    toast.show();
    setTimeout(function () {
        toastEl.remove();
    }, 5000);
}

function getLocationOptions() {
    return [
        { value: "eastus", text: "East US" },
        { value: "eastus2", text: "East US 2" },
        { value: "centralus", text: "Central US" },
        { value: "northcentralus", text: "North Central US" },
        { value: "southcentralus", text: "South Central US" },
        { value: "westus", text: "West US" },
        { value: "westus2", text: "West US 2" },
        { value: "westus3", text: "West US 3" },
        { value: "australiaeast", text: "Australia East" },
        { value: "australiasoutheast", text: "Australia Southeast" },
        { value: "australiacentral", text: "Australia Central" },
        { value: "australiacentral2", text: "Australia Central 2" },
        { value: "japaneast", text: "Japan East" },
        { value: "japanwest", text: "Japan West" },
        { value: "koreacentral", text: "Korea Central" },
        { value: "koreasouth", text: "Korea South" },
        { value: "northeurope", text: "North Europe" },
        { value: "westeurope", text: "West Europe" },
        { value: "francecentral", text: "France Central" },
        { value: "francesouth", text: "France South" },
        { value: "germanywestcentral", text: "Germany West Central" },
        { value: "germanynortheast", text: "Germany Northeast" },
        { value: "switzerlandnorth", text: "Switzerland North" },
        { value: "switzerlandwest", text: "Switzerland West" },
        { value: "uksouth", text: "UK South" },
        { value: "ukwest", text: "UK West" },
        { value: "canadacentral", text: "Canada Central" },
        { value: "canadaeast", text: "Canada East" },
        { value: "brazilsouth", text: "Brazil South" },
        { value: "brazilsoutheast", text: "Brazil Southeast" },
        { value: "uaenorth", text: "UAE North" },
        { value: "uaecentral", text: "UAE Central" },
        { value: "southafricanorth", text: "South Africa North" },
        { value: "southafricawest", text: "South Africa West" },
        { value: "indiacentral", text: "Central India" },
        { value: "indiasouth", text: "South India" },
        { value: "indiawest", text: "West India" },
        { value: "chinaleast", text: "China East" },
        { value: "chinanorth", text: "China North" },
        { value: "chinanorth2", text: "China North 2" }
    ];
}

function setupAccordionEventListeners() {
    $('#collapseEffect').on('shown.bs.collapse', function () {
        setupDraggableNodes();
    });

    $(".draggable-node").off("dragstart").on("dragstart", function (e) {
        console.log("Drag started for node: ", $(this).attr("data-node"));
        e.originalEvent.dataTransfer.setData("text/plain", $(this).attr("data-node"));
    });
}

function initDrawflow() {
    createEditor();
    setupConnectionEvents();
    setupEditorDrop();
    loadLogicalNodes();
    loadFieldsNodes();
    loadConditionsNodes();
    loadEffectNodes();
    loadExampleNodes();
    setupFieldSelectEvents();
    setupAccordionEventListeners();

    $("#btnGeneratePolicy").click(function () {
        generatePolicy();
    });
}