require('dotenv').config();
const https = require('https');
const fs = require('fs');
const express = require('express');
const axios = require('axios');
const httpntlm = require('httpntlm');
const cheerio = require('cheerio');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: '*' }));

app.use(express.static(path.join(__dirname, 'frontend/dist')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});


// Environment Variables
const {
  CLIENT_ID,
  CLIENT_SECRET,
  GRANT_TYPE,
  PASSWORD_TYPE,
  OAUTH_USERNAME,
  OAUTH_PASSWORD,
  TYPE,
  PWD_TYPE,
  LANGUAGE,
  NTLM_USERNAME,
  NTLM_PASSWORD,
  NTLM_DOMAIN,
  PORT
} = process.env;

// Early check for required ENV variables
const requiredEnvVars = [
  'CLIENT_ID',
  'CLIENT_SECRET',
  'GRANT_TYPE',
  'PASSWORD_TYPE',
  'OAUTH_USERNAME',
  'OAUTH_PASSWORD',
  'TYPE',
  'PWD_TYPE',
  'LANGUAGE',
  'NTLM_USERNAME',
  'NTLM_PASSWORD',
  'NTLM_DOMAIN',
  'PORT'
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    // You can optionally throw an error here to prevent the server from starting
    // console.error(`Missing required environment variable: ${envVar}`);
  }
});

// Token Storage
let accessToken = null;
let refreshToken = null;
let tokenExpiry = null;

// Function to fetch OAuth2 Token
const fetchAccessToken = async () => {
  try {
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type', GRANT_TYPE);
    params.append('password_type', PASSWORD_TYPE);
    params.append('username', OAUTH_USERNAME);
    params.append('password', OAUTH_PASSWORD);
    params.append('type', TYPE);
    params.append('pwdType', PWD_TYPE);
    params.append('language', LANGUAGE);

    const response = await axios.post(
      'https://iot.inhandnetworks.com/oauth2/access_token',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;
    tokenExpiry =
      Date.now() +
      response.data.expires_in * 1000 -
      60 * 1000; // Refresh 1 minute before expiry

    console.log('Access token fetched successfully.');
  } catch (error) {
    // Log error details from Axios if available
    if (error.response) {
      console.error('Error fetching access token:', error.response.data);
    } else {
      console.error('Error fetching access token:', error.message);
    }
    // Optionally, rethrow or handle in another way
    // console.error('Failed to fetch access token');
  }
};

// Function to refresh the token if needed
const ensureTokenValidity = async () => {
  try {
    if (!accessToken || Date.now() >= tokenExpiry) {
      await fetchAccessToken();
    }
  } catch (error) {
    // If token refresh fails, log and optionally rethrow
    console.error('Error ensuring token validity:', error.message);
  }
};

// Initial Token Fetch
fetchAccessToken().catch((error) => {
  console.error('Initial token fetch error:', error.message);
});

// Schedule Token Refresh every minute to check if refresh is needed
setInterval(() => {
  ensureTokenValidity().catch((error) => {
    console.error('Scheduled token refresh error:', error.message);
  });
}, 60 * 1000);

// Helper Function to perform NTLM GET Requests
const ntlmGet = (url, headers) => {
  return new Promise((resolve, reject) => {
    httpntlm.get(
      {
        url: url,
        username: NTLM_USERNAME,
        password: NTLM_PASSWORD,
        domain: NTLM_DOMAIN,
        workstation: '',
        headers: headers,
        binary: true,
      },
      (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res.body);
        }
      }
    );
  });
};

// Helper Function to perform NTLM POST Requests
const ntlmPost = (url, headers, body) => {
  return new Promise((resolve, reject) => {
    httpntlm.post(
      {
        url: url,
        username: NTLM_USERNAME,
        password: NTLM_PASSWORD,
        domain: NTLM_DOMAIN,
        workstation: '',
        headers: headers,
        body: body,
        binary: true,
      },
      (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res.body);
        }
      }
    );
  });
};

// Helper Function to extract Account Names from HTML based on DOM structure
const extractAccountNames = (html) => {
  const $ = cheerio.load(html);
  const accountNames = [];

  // Iterate over each table row with class 'ms-crm-List-Row'
  $('tr.ms-crm-List-Row').each((i, row) => {
    // Within each row, find the <a> tag with class 'ms-crm-List-Link'
    const accountLink = $(row).find('a.ms-crm-List-Link').first();

    // Extract and trim the account name text
    const accountName = accountLink.text().trim();
    if (accountName) {
      accountNames.push(accountName);
    }
  });

  return accountNames;
};

// Helper Function to extract Serial Numbers from HTML based on DOM structure
const extractSerialNumbers = (html) => {
  const $ = cheerio.load(html);
  const serialNumbers = [];

  // Define the column indices for serial number and status (0-based)
  const SERIAL_NUMBER_COLUMN_INDEX = 1; // Adjust if different in your HTML
  const STATUS_COLUMN_INDEX = 13; // Adjust if different in your HTML

  // Iterate over each table row with class 'ms-crm-List-Row'
  $('tr.ms-crm-List-Row').each((i, row) => {
    const tds = $(row).find('td');

    // Ensure the row has enough cells
    if (tds.length > Math.max(SERIAL_NUMBER_COLUMN_INDEX, STATUS_COLUMN_INDEX)) {
      // Select the <td> that contains the serial number
      const serialTd = $(tds[SERIAL_NUMBER_COLUMN_INDEX]);

      // Find the <a> tag with class 'ms-crm-List-Link' within this <td>
      const serialLink = serialTd.find('a.ms-crm-List-Link');

      // Extract and trim the serial number text
      const serial = serialLink.text().trim();

      // Select the <td> that contains the status
      const statusTd = $(tds[STATUS_COLUMN_INDEX]);

      // Extract and trim the status text
      const status = statusTd.text().trim();

      // Add the serial number to the list if the status is "Active"
      if (status === 'Active' && serial) {
        serialNumbers.push(serial);
      } else if (!serial) {
        console.warn(`No serial number found in row ${i + 1}`);
      } else {
        console.warn(`Row ${i + 1} has status '${status}', not 'Active'.`);
      }
    } else {
      console.warn(`Row ${i + 1} does not have enough <td> elements.`);
    }
  });

  return serialNumbers;
};

// Endpoint to get devices list
app.post('/api/get_devices_list', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required.' });
  }

  try {
    // Step 1: Send initial NTLM request to get Account Names
    const initialUrl = 'http://10.10.0.27/NationalLinkInc/AppWebServices/AppGridWebService.ashx?id=crmGrid&operation=Reset';
    const initialHeaders = {
      'Referer': 'http://10.10.0.27/NationalLinkInc/_root/homepage.aspx?etc=1&pagemode=iframe&sitemappath=CS%7cCS%7cnav_accts',
      'Content-Type': 'text/xml'
    };

    // Construct XML Body with dynamic email, pageNumber, pageSize
    const initialBody = `
            <grid>
                <sortColumns>name&#58;1</sortColumns>
                <pageNum>1</pageNum>
                <recsPerPage>999</recsPerPage>
                <dataProvider>Microsoft.Crm.Application.Platform.Grid.GridDataProviderQueryBuilder</dataProvider>
                <uiProvider>Microsoft.Crm.Application.Controls.GridUIProvider</uiProvider>
                <cols/>
                <max>-1</max>
                <refreshAsync>False</refreshAsync>
                <pagingCookie/>
                <enableMultiSort>true</enableMultiSort>
                <enablePagingWhenOnePage>true</enablePagingWhenOnePage>
                <parameters>
                    <autorefresh>1</autorefresh>
                    <isGridHidden>false</isGridHidden>
                    <isGridFilteringEnabled>1</isGridFilteringEnabled>
                    <viewid>{2D1187C4-23FE-4BB5-9647-43BB1C6DDBD1}</viewid>
                    <viewtype>1039</viewtype>
                    <RecordsPerPage>999</RecordsPerPage>
                    <viewTitle>Active Accounts</viewTitle>
                    <otc>1</otc>
                    <otn>account</otn>
                    <entitydisplayname>Account</entitydisplayname>
                    <titleformat>{0} {1}</titleformat>
                    <entitypluraldisplayname>Accounts</entitypluraldisplayname>
                    <isWorkflowSupported>true</isWorkflowSupported>
                    <fetchXmlForFilters>
                        &lt;fetch version="1.0" output-format="xml-platform" mapping="logical"&gt;
                            &lt;entity name="account"&gt;
                                &lt;attribute name="name" /&gt;
                                &lt;attribute name="address1_city" /&gt;
                                &lt;attribute name="telephone1" /&gt;
                                &lt;filter type="and"&gt;
                                    &lt;condition attribute="statecode" operator="eq" value="0" /&gt;
                                &lt;/filter&gt;
                                &lt;attribute name="nl_accountcontactid" /&gt;
                                &lt;link-entity alias="a_1a779ce98493df11a794001aa04053b3" name="contact" from="contactid" to="nl_accountcontactid" link-type="outer" visible="false"&gt;
                                    &lt;attribute name="emailaddress1" /&gt;
                                &lt;/link-entity&gt;
                                &lt;attribute name="nl_accounttype" /&gt;
                                &lt;attribute name="address1_stateorprovince" /&gt;
                                &lt;attribute name="accountid" /&gt;
                            &lt;/entity&gt;
                        &lt;/fetch&gt;
                    </fetchXmlForFilters>
                    <isFetchXmlNotFinal>False</isFetchXmlNotFinal>
                    <effectiveFetchXml>
                        &lt;fetch distinct="false" no-lock="false" mapping="logical" page="1" count="50" returntotalrecordcount="true"&gt;
                            &lt;entity name="account"&gt;
                                &lt;attribute name="name" /&gt;
                                &lt;attribute name="address1_city" /&gt;
                                &lt;attribute name="telephone1" /&gt;
                                &lt;attribute name="nl_accountcontactid" /&gt;
                                &lt;attribute name="nl_accounttype" /&gt;
                                &lt;attribute name="address1_stateorprovince" /&gt;
                                &lt;attribute name="accountid" /&gt;
                                &lt;filter type="and"&gt;
                                    &lt;condition attribute="statecode" operator="eq" value="0" /&gt;
                                &lt;/filter&gt;
                                &lt;order attribute="name" descending="false" /&gt;
                                &lt;link-entity name="contact" to="nl_accountcontactid" from="contactid" link-type="outer" alias="a_1a779ce98493df11a794001aa04053b3"&gt;
                                    &lt;attribute name="emailaddress1" /&gt;
                                &lt;/link-entity&gt;
                            &lt;/entity&gt;
                        &lt;/fetch&gt;
                    </effectiveFetchXml>
                    <LayoutStyle>GridList</LayoutStyle>
                    <enableFilters>1</enableFilters>
                    <quickfind>${email}</quickfind>
                    <filter/>
                    <filterDisplay/>
                </parameters>
            </grid>
        `;

    // Await the initial NTLM POST request
    const initialResponse = await ntlmPost(initialUrl, initialHeaders, initialBody);
    const accountNames = extractAccountNames(initialResponse);

    // If no accounts found, return early
    if (accountNames.length === 0) {
      return res.json({ message: 'No accounts found for the provided email.', data: [] });
    }

    // Initialize results array
    const results = [];

    // Iterate over each account name sequentially
    for (const accountName of accountNames) {
      const deviceUrl = 'http://10.10.0.27/NationalLinkInc/AppWebServices/AppGridWebService.ashx?id=crmGrid&operation=Reset';
      const deviceHeaders = {
        'Referer': 'http://10.10.0.27/NationalLinkInc/_root/homepage.aspx?etc=10014&pagemode=iframe&sitemappath=CS%7cCS%7cnl_wireless',
        'Content-Type': 'text/xml'
      };

      // Construct XML Body with dynamic account name
      const deviceBody = `
                <grid>
                    <sortColumns>createdon&#58;0</sortColumns>
                    <pageNum>1</pageNum>
                    <recsPerPage>999</recsPerPage>
                    <dataProvider>Microsoft.Crm.Application.Platform.Grid.GridDataProviderQueryBuilder</dataProvider>
                    <uiProvider>Microsoft.Crm.Application.Controls.GridUIProvider</uiProvider>
                    <cols/>
                    <max>-1</max>
                    <refreshAsync>False</refreshAsync>
                    <pagingCookie/>
                    <enableMultiSort>true</enableMultiSort>
                    <enablePagingWhenOnePage>true</enablePagingWhenOnePage>
                    <parameters>
                        <autorefresh>1</autorefresh>
                        <isGridHidden>false</isGridHidden>
                        <isGridFilteringEnabled>1</isGridFilteringEnabled>
                        <viewid>{87050EA1-B815-413E-AC64-4695DA9308A3}</viewid>
                        <viewtype>1039</viewtype>
                        <RecordsPerPage>999</RecordsPerPage>
                        <viewTitle>Active Wireless</viewTitle>
                        <otc>10014</otc>
                        <otn>nl_wireless</otn>
                        <entitydisplayname>Wireless</entitydisplayname>
                        <titleformat>{0} {1}</titleformat>
                        <entitypluraldisplayname>Wireless</entitypluraldisplayname>
                        <isWorkflowSupported>true</isWorkflowSupported>
                        <fetchXmlForFilters>
                            &lt;fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="false"&gt;
                                &lt;entity name="nl_wireless"&gt;
                                    &lt;attribute name="nl_serialnumber" /&gt;
                                    &lt;attribute name="createdon" /&gt;
                                    &lt;attribute name="nl_serviceprovidercode" /&gt;
                                    &lt;attribute name="nl_locationid" /&gt;
                                    &lt;attribute name="nl_accountid" /&gt;
                                    &lt;attribute name="nl_wirelessphonenumber" /&gt;
                                    &lt;attribute name="nl_verizonserialnumber" /&gt;
                                    &lt;attribute name="nl_routerserialnumber" /&gt;
                                    &lt;order attribute="createdon" descending="true" /&gt;
                                    &lt;filter type="and"&gt;
                                        &lt;condition attribute="statecode" operator="eq" value="0" /&gt;
                                        &lt;condition attribute="statuscode" operator="in"&gt;
                                            &lt;value&gt;1&lt;/value&gt;
                                            &lt;value&gt;100000002&lt;/value&gt;
                                        &lt;/condition&gt;
                                    &lt;/filter&gt;
                                &lt;/entity&gt;
                            &lt;/fetch&gt;
                        </fetchXmlForFilters>
                        <isFetchXmlNotFinal>False</isFetchXmlNotFinal>
                        <effectiveFetchXml>
                            &lt;fetch distinct="false" no-lock="false" mapping="logical" page="1" count="50" returntotalrecordcount="true"&gt;
                                &lt;entity name="nl_wireless"&gt;
                                    &lt;attribute name="nl_serialnumber" /&gt;
                                    &lt;attribute name="createdon" /&gt;
                                    &lt;attribute name="nl_serviceprovidercode" /&gt;
                                    &lt;attribute name="nl_locationid" /&gt;
                                    &lt;attribute name="nl_accountid" /&gt;
                                    &lt;attribute name="nl_wirelessphonenumber" /&gt;
                                    &lt;attribute name="nl_verizonserialnumber" /&gt;
                                    &lt;attribute name="nl_routerserialnumber" /&gt;
                                    &lt;attribute name="nl_wirelessid" /&gt;
                                    &lt;filter type="and"&gt;
                                        &lt;condition attribute="statecode" operator="eq" value="0" /&gt;
                                        &lt;condition attribute="statuscode" operator="in"&gt;
                                            &lt;value&gt;1&lt;/value&gt;
                                            &lt;value&gt;100000002&lt;/value&gt;
                                        &lt;/condition&gt;
                                    &lt;/filter&gt;
                                    &lt;order attribute="createdon" descending="true" /&gt;
                                &lt;/entity&gt;
                            &lt;/fetch&gt;
                        </effectiveFetchXml>
                        <LayoutStyle>GridList</LayoutStyle>
                        <enableFilters>1</enableFilters>
                        <quickfind>${accountName.replace(/&/g, "&#38;")}</quickfind>
                        <filter/>
                        <filterDisplay/>
                    </parameters>
                </grid>
            `;

      // Await the device NTLM POST request
      const deviceResponse = await ntlmPost(deviceUrl, deviceHeaders, deviceBody);
      const serialNumbers = extractSerialNumbers(deviceResponse);

      console.log('device response', serialNumbers);


      const devices = [];

      // Iterate over each serial number sequentially
      for (const serialNum of serialNumbers) {
        try {
          // Fetch device by serial number
          const deviceResp = await axios.get(`https://iot.inhandnetworks.com/api/devices?name=${serialNum}`, {
            headers: {
              'Authorization': accessToken
            }
          });

          if (deviceResp.data.result && deviceResp.data.result.length > 0) {
            const deviceId = deviceResp.data.result[0]._id;

            // Fetch detailed device information
            const deviceDetailResp = await axios.get(`https://iot.inhandnetworks.com/api/devices/${deviceId}?verbose=100`, {
              headers: {
                'Authorization': accessToken
              }
            });

            devices.push(deviceDetailResp.data.result);
          } else {
            console.warn(`No device found for serial number: ${serialNum}`);
          }
        } catch (deviceError) {
          console.error(`Error fetching device details for serial number ${serialNum}:`, deviceError);
          // Optionally, continue to the next serial number or handle the error as needed
        }
      }

      // Push the account and its devices to the results array
      results.push({
        accountName,
        devices
      });
    }

    // Send the final results as JSON response
    res.json({ data: results });

  } catch (error) {
    console.error('Error in /api/get_devices_list:', error);
    res.status(500).json({ error: 'Internal Server Error.' });
  }

});


const extractentityTypeIobjectId = (xmlString) => {
  // Load the XML string using cheerio
  const $ = cheerio.load(xmlString);

  // Extract the 'Entity Type ID' (oname attribute in <table>)
  const entityTypeId = $('table[oname]').attr('oname') || null;

  // Extract the 'Object ID' (oid attribute in <tr>)
  const objectId = $('tr[oid]').attr('oid') || null;

  // Return the extracted data
  return {
    entityTypeId,
    objectId
  };
}

const extractEntityData = (html) => {
  const $ = cheerio.load(html);
  let _entityData = null;

  // Iterate over each <script> tag with type="text/javascript"
  $('script[type="text/javascript"]').each((i, script) => {
    const scriptContent = $(script).html();

    // Match and extract _entityData
    const match = scriptContent.match(/var _entityData = '(.*?)';/);
    if (match && match[1]) {
      _entityData = match[1];
    }
  });

  if (_entityData) {
    try {
      // Parse the _entityData JSON string
      const cleanedData = _entityData.replace(/\\x[0-9a-fA-F]{2}/g, match => String.fromCharCode(parseInt(match.replace('\\x', ''), 16)))
        .replace(/\\u[0-9a-fA-F]{4}/g, match => String.fromCharCode(parseInt(match.replace('\\u', ''), 16)))
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
      const entityData = JSON.parse(cleanedData);

      // Extract Wireless Plan and Monthly Rate
      const wirelessPlan = entityData.nl_wirelessplan?.value || "N/A";
      const monthlyRate = entityData.nl_monthlyrate?.value ? `$${entityData.nl_monthlyrate.value}` : "N/A";

      // Return the extracted values
      return {
        wirelessPlan,
        monthlyRate,
      };
    } catch (error) {
      console.error("Error parsing _entityData JSON:", error);
      return {
        wirelessPlan: "",
        monthlyRate: "",
      };
    }
  } else {
    console.error("Unable to find _entityData in any <script> tag.");
    return {
      wirelessPlan: "",
      monthlyRate: "",
    };
  }
};

// Endpoint to get a single device by ID
app.get('/api/get_device/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Cannot find device id.' });
    }

    const deviceDetail = await axios.get(
      `https://iot.inhandnetworks.com/api/devices/${id}?verbose=100`,
      {
        headers: {
          Authorization: accessToken,
        },
      }
    );

    const deviceUrlCRM = 'http://10.10.0.27/NationalLinkInc/AppWebServices/AppGridWebService.ashx?id=crmGrid&operation=Reset';
    const deviceHeadersCRM = {
      Referer: 'http://10.10.0.27/NationalLinkInc/_root/homepage.aspx?etc=10014&pagemode=iframe&sitemappath=CS%7cCS%7cnl_wireless',
      'Content-Type': 'text/xml',
    };

    const deviceBodyCRM = `
              <grid>
                  <sortColumns>createdon&#58;0</sortColumns>
                  <pageNum>1</pageNum>
                  <recsPerPage>999</recsPerPage>
                  <dataProvider>Microsoft.Crm.Application.Platform.Grid.GridDataProviderQueryBuilder</dataProvider>
                  <uiProvider>Microsoft.Crm.Application.Controls.GridUIProvider</uiProvider>
                  <cols/>
                  <max>-1</max>
                  <refreshAsync>False</refreshAsync>
                  <pagingCookie/>
                  <enableMultiSort>true</enableMultiSort>
                  <enablePagingWhenOnePage>true</enablePagingWhenOnePage>
                  <parameters>
                      <autorefresh>1</autorefresh>
                      <isGridHidden>false</isGridHidden>
                      <isGridFilteringEnabled>1</isGridFilteringEnabled>
                      <viewid>{87050EA1-B815-413E-AC64-4695DA9308A3}</viewid>
                      <viewtype>1039</viewtype>
                      <RecordsPerPage>999</RecordsPerPage>
                      <viewTitle>Active Wireless</viewTitle>
                      <otc>10014</otc>
                      <otn>nl_wireless</otn>
                      <entitydisplayname>Wireless</entitydisplayname>
                      <titleformat>{0} {1}</titleformat>
                      <entitypluraldisplayname>Wireless</entitypluraldisplayname>
                      <isWorkflowSupported>true</isWorkflowSupported>
                      <fetchXmlForFilters>
                          &lt;fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="false"&gt;
                              &lt;entity name="nl_wireless"&gt;
                                  &lt;attribute name="nl_serialnumber" /&gt;
                                  &lt;attribute name="createdon" /&gt;
                                  &lt;attribute name="nl_serviceprovidercode" /&gt;
                                  &lt;attribute name="nl_locationid" /&gt;
                                  &lt;attribute name="nl_accountid" /&gt;
                                  &lt;attribute name="nl_wirelessphonenumber" /&gt;
                                  &lt;attribute name="nl_verizonserialnumber" /&gt;
                                  &lt;attribute name="nl_routerserialnumber" /&gt;
                                  &lt;order attribute="createdon" descending="true" /&gt;
                                  &lt;filter type="and"&gt;
                                      &lt;condition attribute="statecode" operator="eq" value="0" /&gt;
                                      &lt;condition attribute="statuscode" operator="in"&gt;
                                          &lt;value&gt;1&lt;/value&gt;
                                          &lt;value&gt;100000002&lt;/value&gt;
                                      &lt;/condition&gt;
                                  &lt;/filter&gt;
                              &lt;/entity&gt;
                          &lt;/fetch&gt;
                      </fetchXmlForFilters>
                      <isFetchXmlNotFinal>False</isFetchXmlNotFinal>
                      <effectiveFetchXml>
                          &lt;fetch distinct="false" no-lock="false" mapping="logical" page="1" count="50" returntotalrecordcount="true"&gt;
                              &lt;entity name="nl_wireless"&gt;
                                  &lt;attribute name="nl_serialnumber" /&gt;
                                  &lt;attribute name="createdon" /&gt;
                                  &lt;attribute name="nl_serviceprovidercode" /&gt;
                                  &lt;attribute name="nl_locationid" /&gt;
                                  &lt;attribute name="nl_accountid" /&gt;
                                  &lt;attribute name="nl_wirelessphonenumber" /&gt;
                                  &lt;attribute name="nl_verizonserialnumber" /&gt;
                                  &lt;attribute name="nl_routerserialnumber" /&gt;
                                  &lt;attribute name="nl_wirelessid" /&gt;
                                  &lt;filter type="and"&gt;
                                      &lt;condition attribute="statecode" operator="eq" value="0" /&gt;
                                      &lt;condition attribute="statuscode" operator="in"&gt;
                                          &lt;value&gt;1&lt;/value&gt;
                                          &lt;value&gt;100000002&lt;/value&gt;
                                      &lt;/condition&gt;
                                  &lt;/filter&gt;
                                  &lt;order attribute="createdon" descending="true" /&gt;
                              &lt;/entity&gt;
                          &lt;/fetch&gt;
                      </effectiveFetchXml>
                      <LayoutStyle>GridList</LayoutStyle>
                      <enableFilters>1</enableFilters>
                      <quickfind>${deviceDetail.data.result.name}</quickfind>
                      <filter/>
                      <filterDisplay/>
                  </parameters>
              </grid>
          `;

    const deviceResponseCRM = await ntlmPost(deviceUrlCRM, deviceHeadersCRM, deviceBodyCRM);

    const { entityTypeId, objectId } = await extractentityTypeIobjectId(deviceResponseCRM);

    if (!entityTypeId || !objectId) {
      console.error('Failed to extract entity type or object ID.');
    }

    const extraDataUrl = await `http://10.10.0.27/NationalLinkInc/main.aspx?etc=${entityTypeId}&extraqs=%3f_gridType%3d${entityTypeId}%26etc%3d${entityTypeId}%26id%3d%257b${objectId.replace(/[{}]/g, "")}%257d%26rskey%3d%257b87050EA1-B815-413E-AC64-4695DA9308A3%257d&pagemode=iframe&pagetype=entityrecord&rskey=%7b87050EA1-B815-413E-AC64-4695DA9308A3%7d`;
    const extraDataHeaders = {
      'Host': '10.10.0.27',
      'User-Agent': 'PostmanRuntime/7.43.0',
      'Postman-Token': 'c25829da-0930-4675-9294-c758c4654118',
      'Cookie': 'ReqClientId=b36705eb-5f26-42de-bbe9-651e49d438d3; ReqClientId=b36705eb-5f26-42de-bbe9-651e49d438d3; ReqClientId=b36705eb-5f26-42de-bbe9-651e49d438d3'
    }
    const extraDataResponse = await ntlmGet(extraDataUrl, extraDataHeaders);

    const { wirelessPlan, monthlyRate } = await extractEntityData(extraDataResponse);

    res.json({ result: deviceDetail.data.result, extraData: { wirelessPlan, monthlyRate } });
  } catch (error) {
    console.error('Error in /api/get_device:', error.message);
    next(error);
  }
});

// Endpoint to get data usage
app.get('/api/get_data_usage/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Cannot find device id.' });
    }

    const { oid, unit, after, before, month } = req.query;
    let dataUsage;

    if (unit === 'hour') {
      dataUsage = await axios.get(
        `https://iot.inhandnetworks.com/api/devices/${id}/data-usage/raw?after=${after}&before=${before}`,
        {
          headers: {
            Authorization: accessToken,
          },
        }
      );
    } else {
      dataUsage = await axios.get(
        `https://iot.inhandnetworks.com/api/traffic_day?device_id=${id}&oid=${oid}&month=${month}`,
        {
          headers: {
            Authorization: accessToken,
          },
        }
      );
    }

    res.json({ result: dataUsage.data.result });
  } catch (error) {
    console.error('Error in /api/get_data_usage:', error.message);
    next(error);
  }
});

// Endpoint to get connection status
app.get('/api/get_connection_status/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Cannot find device id.' });
    }

    const { start_time, end_time } = req.query;
    const connectionStatus = await axios.get(
      `https://iot.inhandnetworks.com/api/devices/${id}/online-events?start_time=${start_time}&end_time=${end_time}`,
      {
        headers: {
          Authorization: accessToken,
        },
      }
    );

    res.json({ result: connectionStatus.data.result.data });
  } catch (error) {
    console.error('Error in /api/get_connection_status:', error.message);
    next(error);
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

/**
 * Global Error Handling Middleware
 * Catches errors from any route and returns a consistent JSON response.
 * Make sure this is the last middleware added.
 */
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack || err.message);
  res.status(500).json({ error: 'Internal Server Error.' });
});

// Start the Server
// Use a try/catch if you need more robust handling at startup

const privateKey = fs.readFileSync('./ssl/privkey.pem', 'utf8');
const certificate = fs.readFileSync('./ssl/cert.pem', 'utf8');
const ca = fs.readFileSync('./ssl/fullchain.pem', 'utf8');

const credentials = { key: privateKey, cert: certificate, ca: ca };


try {
  https.createServer(credentials, app).listen(PORT || 443, () => {
    console.log('Express server running on https://wireless.atmtrader.com');
  });
  // app.listen(PORT || 3000, () => {
  //   console.log(`Server is running on port ${PORT || 80}`);
  // });
} catch (error) {
  console.error('Error starting server:', error.message);
  process.exit(1);
}
